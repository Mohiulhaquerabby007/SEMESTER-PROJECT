import { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user data in Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // Create new user profile
          const newUser = {
            uid: currentUser.uid,
            name: currentUser.displayName || "User",
            email: currentUser.email || "",
            phone: currentUser.phoneNumber || "",
            photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=0D8ABC&color=fff`,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const loginWithPhone = async (phoneNumber, recaptchaContainerId) => {
    try {
      setupRecaptcha(recaptchaContainerId);
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      return confirmation;
    } catch (error) {
      console.error("Phone login error:", error);
      throw error;
    }
  };

  const verifyOTP = async (otp) => {
    try {
      if (!confirmationResult) throw new Error("No OTP request found");
      await confirmationResult.confirm(otp);
      setConfirmationResult(null);
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const updateProfile = async (data) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const updatedData = { ...userData, ...data };
    await setDoc(userRef, updatedData, { merge: true });
    setUserData(updatedData);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setConfirmationResult(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      loginWithGoogle, 
      loginWithPhone, 
      verifyOTP, 
      logout,
      updateProfile,
      hasPendingOTP: !!confirmationResult
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
