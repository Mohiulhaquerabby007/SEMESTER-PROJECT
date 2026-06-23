import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("quickdrop_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, isRider = false) => {

    const endpoint = isRider ? "/auth/rider/login" : "/auth/login";
    console.log(endpoint);
    
    const { data } = await api.post(endpoint, { email, password });
    const userData = { ...data, accountType: isRider ? "rider" : data.role === "admin" ? "admin" : "user" };
    localStorage.setItem("quickdrop_auth", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const googleLogin = async (googleIdToken) => {
    const { data } = await api.post("/auth/google-login", { token: googleIdToken });
    const userData = { ...data, accountType: data.role === "admin" ? "admin" : "user" };
    localStorage.setItem("quickdrop_auth", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (payload, isRider = false) => {
    const endpoint = isRider ? "/auth/rider/register" : "/auth/register";
    const { data } = await api.post(endpoint, payload);
    const userData = { ...data, accountType: isRider ? "rider" : "user" };
    localStorage.setItem("quickdrop_auth", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("quickdrop_auth");
    setUser(null);
    navigate("/login");
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem("quickdrop_auth", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
