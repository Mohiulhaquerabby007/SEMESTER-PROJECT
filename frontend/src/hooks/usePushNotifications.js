import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/**
 * Cross-platform push notification hook.
 *
 * Strategy:
 *  1. On Capacitor (native Android/iOS) → use @capacitor/push-notifications
 *  2. On web browsers → use the browser Notification API to request permission,
 *     then store a "web" placeholder token so the UI shows it's subscribed.
 *     Full FCM web push requires a service-worker + VAPID key setup that needs
 *     the Firebase project's web config — that setup guide is returned as a status.
 */

const isCapacitor = () =>
  typeof window !== "undefined" &&
  window.Capacitor !== undefined &&
  window.Capacitor.isNativePlatform?.();

export const usePushNotifications = (user) => {
  const navigate = useNavigate();
  const [pushStatus, setPushStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initPush = async () => {
      setPushStatus("requesting");

      /* ── Native Capacitor path ──────────────────────────────── */
      if (isCapacitor()) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");

          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== "granted") {
            if (isMounted) setPushStatus("denied");
            return;
          }

          await PushNotifications.register();
          if (isMounted) setPushStatus("granted");

          PushNotifications.addListener("registration", async (token) => {
            if (!isMounted) return;
            try {
              await api.post("/auth/update-fcm-token", { fcmToken: token.value });
              console.log("✅ FCM token registered on server");
            } catch (err) {
              console.error("Failed to update FCM token", err);
            }
          });

          PushNotifications.addListener("registrationError", (err) => {
            console.error("FCM registration error:", err);
            if (isMounted) setPushStatus("denied");
          });

          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("Push received:", notification);
          });

          PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            const route = action.notification?.data?.route;
            if (route && isMounted) navigate(route);
          });
        } catch (err) {
          console.warn("Capacitor push init failed:", err.message);
          if (isMounted) setPushStatus("unsupported");
        }
        return;
      }

      /* ── Web browser path ───────────────────────────────────── */
      if (!("Notification" in window)) {
        if (isMounted) setPushStatus("unsupported");
        return;
      }

      try {
        const permission = await Notification.requestPermission();

        if (!isMounted) return;

        if (permission === "granted") {
          setPushStatus("granted");
          
          try {
            // Import dynamically to avoid breaking Capacitor builds
            const { messaging, getToken, onMessage } = await import("../config/firebase");
            
            // Note: User must provide VAPID key in .env as VITE_FIREBASE_VAPID_KEY
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            
            if (!vapidKey) {
              console.warn("Missing VITE_FIREBASE_VAPID_KEY in .env. Web push will fail.");
            }

            const currentToken = await getToken(messaging, { vapidKey });
            
            if (currentToken) {
              await api.post("/auth/update-fcm-token", { fcmToken: currentToken });
              console.log("✅ Web FCM token registered");
              
              // Listen for foreground messages
              onMessage(messaging, (payload) => {
                console.log("Message received in foreground: ", payload);
                
                import("react-hot-toast").then(({ toast }) => {
                  toast(
                    `${payload.notification?.title || "New Notification"}\n${payload.notification?.body || ""}`,
                    { 
                      icon: "🔔", 
                      duration: 6000, 
                      position: "top-right",
                      style: {
                        borderRadius: '12px',
                        background: '#333',
                        color: '#fff',
                        maxWidth: '400px'
                      }
                    }
                  );
                });
              });
            } else {
              console.warn("No registration token available. Request permission to generate one.");
            }
          } catch (firebaseErr) {
            console.error("Firebase Web Push error:", firebaseErr);
          }

        } else {
          setPushStatus(permission === "denied" ? "denied" : "idle");
        }
      } catch (err) {
        console.warn("Web notification init failed:", err.message);
        if (isMounted) setPushStatus("unsupported");
      }
    };

    initPush();

    return () => {
      isMounted = false;
      if (isCapacitor()) {
        import("@capacitor/push-notifications")
          .then(({ PushNotifications }) => PushNotifications.removeAllListeners())
          .catch(() => {});
      }
    };
  }, [user, navigate]);

  return { pushStatus };
};
