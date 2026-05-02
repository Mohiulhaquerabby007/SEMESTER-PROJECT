import { useState, useRef, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(48);
  const inputRefs = useRef([]);
  const { verifyOTP, hasPendingOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!hasPendingOTP) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    // Handle pasting multiple digits
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split("");
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) newOtp[index + i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return toast.error("Please enter all 6 digits");

    setLoading(true);
    try {
      await verifyOTP(otpString);
      toast.success("Verification successful!");
      navigate("/success");
    } catch (error) {
      toast.error(error.message || "Invalid OTP code");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-success/20 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-[2rem] p-8 md:p-10 text-center">
          
          <h1 className="text-2xl font-bold text-text-main mb-2">Verify Number</h1>
          <p className="text-text-muted mb-10">
            Enter the 6-digit code sent to your phone
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 sm:gap-4 mb-10">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-text-main rounded-xl neumorphic-otp focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-text-muted text-sm">
              Didn't receive the code?{" "}
              {countdown > 0 ? (
                <span className="font-medium">Resend Code (00:{countdown.toString().padStart(2, '0')})</span>
              ) : (
                <button 
                  onClick={() => {
                    toast.success("This would trigger a resend if implemented in the UI flow");
                    setCountdown(48);
                  }} 
                  className="text-primary font-medium hover:underline"
                >
                  Resend Now
                </button>
              )}
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
