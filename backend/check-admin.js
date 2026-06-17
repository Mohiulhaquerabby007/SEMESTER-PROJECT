require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const user = await User.findOne({ email: "admin@quickdrop.com" });
    if (user) {
      console.log("Admin user found:", user.email);
    } else {
      console.log("Admin user NOT found");
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkUser();
