import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { HiOutlineLogout, HiOutlineMoon, HiOutlineSun, HiOutlinePencil, HiOutlineCheck } from "react-icons/hi";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, userData, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
    }
    // Check system preference for initial theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // In a real app with Tailwind dark mode configured, you'd apply class here
      // setDarkMode(true);
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({ name });
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // document.documentElement.classList.toggle('dark');
    toast.success(`${darkMode ? 'Light' : 'Dark'} mode enabled! (Demo)`);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-background'}`}>

      {/* Decorative Background Elements */}
      {!darkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className={`rounded-[2rem] p-8 shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'glass-card text-text-main'}`}>

          <div className="flex justify-between items-start mb-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50 shadow-sm'}`}
            >
              {darkMode ? <HiOutlineSun className="text-xl text-yellow-400" /> : <HiOutlineMoon className="text-xl text-gray-600" />}
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <img
                src={userData?.photoURL || `https://ui-avatars.com/api/?name=${name || 'User'}&background=0A64FF&color=fff`}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 shadow-md object-cover"
                style={{ borderColor: darkMode ? '#374151' : '#fff' }}
              />
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                  placeholder="Your Name"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineCheck className="text-xl" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{userData?.name || "User"}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                >
                  <HiOutlinePencil />
                </button>
              </div>
            )}
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-text-muted'}`}>
              {userData?.email || userData?.phone || user.phoneNumber}
            </p>
          </div>

          <div className={`rounded-2xl p-4 mb-8 ${darkMode ? 'bg-gray-700' : 'bg-white/60'} border ${darkMode ? 'border-gray-600' : 'border-white/40'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>ACCOUNT DETAILS</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                <span className="text-sm font-medium text-success flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success"></span> Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Member Since</span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <HiOutlineLogout className="text-xl" />
            Sign Out
          </button>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
