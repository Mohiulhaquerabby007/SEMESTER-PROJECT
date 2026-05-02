import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { IoCheckmarkCircle } from "react-icons/io5";

const Success = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-success/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-[2rem] p-8 md:p-10 text-center flex flex-col items-center">
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-6"
          >
            {/* Sparkles effect behind checkmark */}
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute top-0 right-0 w-2 h-2 bg-success rounded-full" />
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-success rounded-full" />
              <div className="absolute top-1/2 left-[-10px] w-1.5 h-1.5 bg-success rounded-full" />
              <div className="absolute bottom-4 right-[-10px] w-1.5 h-1.5 bg-success rounded-full" />
            </div>
            <IoCheckmarkCircle className="text-8xl text-success drop-shadow-lg" />
          </motion.div>

          <h1 className="text-2xl font-bold text-success mb-8">Login Successful!</h1>

          <div className="flex items-center gap-4 bg-white/50 py-3 px-6 rounded-full border border-white/60 shadow-sm mb-6">
            <img 
              src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.name || 'User'}&background=1DBB62&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <span className="font-semibold text-text-main">{userData?.name || "User"}</span>
          </div>

          <p className="text-text-muted mb-10 max-w-[250px]">
            Welcome to FlexyPay, {userData?.name ? userData.name.split(' ')[0] : 'User'}! Your account is ready.
          </p>

          <button
            onClick={() => navigate("/profile")}
            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-[0.98] mb-4"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate("/profile")}
            className="text-primary font-semibold hover:underline"
          >
            Continue
          </button>

        </div>
      </motion.div>
    </div>
  );
};

export default Success;
