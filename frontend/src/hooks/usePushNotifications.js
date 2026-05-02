import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const usePushNotifications = (user) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== "granted") {
          console.log("Push notification permission not granted");
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener("registration", async (token) => {
          if (!isMounted) return;
          try {
            await api.post("/auth/update-fcm-token", { fcmToken: token.value });
            console.log("FCM Token registered and updated on server");
          } catch (err) {
            console.error("Failed to update FCM token", err);
          }
        });

        PushNotifications.addListener("registrationError", (error) => {
          console.error("Error on registration: " + JSON.stringify(error));
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push received: " + JSON.stringify(notification));
          // Note: Toast is already handled in ChatBox for foreground, but can add here if needed globally
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const route = action.notification.data.route;
          if (route && isMounted) {
            navigate(route);
          }
        });
      } catch (err) {
        console.log("PushNotifications not supported or error: ", err);
      }
    };

    initPush();

    return () => {
      isMounted = false;
      PushNotifications.removeAllListeners().catch(() => {});
    };
  }, [user, navigate]);
};
