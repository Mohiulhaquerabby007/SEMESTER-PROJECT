import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import toast from "react-hot-toast";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const { loginWithGoogle, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await loginWithGoogle();
      toast.success("Login successful!");
      navigate("/success");
    } catch (error) {
      toast.error(error.message || "Failed to login with Google");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Please enter a phone number");
    
    setLoadingPhone(true);
    try {
      const fullNumber = `${countryCode}${phoneNumber}`;
      // Basic validation for E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(fullNumber)) {
        throw new Error("Invalid phone number format");
      }
      
      await loginWithPhone(fullNumber, "recaptcha-container");
      toast.success("OTP sent!");
      navigate("/verify");
    } catch (error) {
      toast.error(error.message || "Failed to send OTP. Check the number format.");
    } finally {
      setLoadingPhone(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-success/20 rounded-full blur-[100px]" />
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-[2rem] p-8 md:p-10">
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              F
            </div>
            <span className="text-2xl font-bold tracking-tight text-text-main">FlexyPay</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-main mb-2">Welcome Back</h1>
            <p className="text-text-muted">Sign in to your account</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingPhone}
            className="w-full neumorphic-button py-3.5 rounded-xl flex items-center justify-center gap-3 text-text-main font-semibold hover:bg-gray-50/50 disabled:opacity-50"
          >
            {loadingGoogle ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FcGoogle className="text-2xl" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-text-muted text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handlePhoneLogin}>
            <div className="neumorphic-input rounded-xl p-2 mb-6 flex items-center focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <div className="flex items-center pr-3 border-r border-border gap-1">
                <span className="text-lg">🇺🇸</span>
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none appearance-none cursor-pointer pl-1"
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+880">+880</option>
                </select>
              </div>
              <div className="flex-1 pl-3">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-0.5">Mobile Number</span>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent border-none focus:outline-none text-text-main font-medium placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPhone || loadingGoogle || !phoneNumber}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
            >
              {loadingPhone ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-text-main font-medium">
              Don't have an account? <a href="#" className="text-primary hover:underline">Sign Up</a>
            </p>
            <p className="text-xs text-text-muted px-4">
              By signing in, you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      </motion.div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
