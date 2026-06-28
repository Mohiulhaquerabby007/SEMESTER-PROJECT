require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const Rider = require("./src/models/Rider");
const User = require("./src/models/User");

// 1. Mock the ImageBB utility function to avoid live API network blocks during controller verification
const imagebb = require("./src/utils/imagebb");
imagebb.uploadToImageBB = async (base64Image) => {
  if (!base64Image || typeof base64Image !== "string" || base64Image.trim() === "") {
    throw new Error("Image data is required and must be a non-empty string");
  }
  // Basic base64 validation (stripping prefix if present)
  let base64Data = base64Image;
  if (base64Image.includes(";base64,")) {
    base64Data = base64Image.split(";base64,")[1];
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data.replace(/\s/g, ""))) {
    throw new Error("Invalid image format: String is not a valid base64 representation");
  }
  return "https://i.ibb.co/mocked-image-url.png";
};

const authController = require("./src/controllers/authController");

async function runTests() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Testing Controllers with ImageBB Mock & DB   ");
  console.log("═══════════════════════════════════════════════\n");

  console.log("Connecting to MongoDB...");
  await connectDB();

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // Test Case 1: Register Rider with Base64 NID Image
  // -------------------------------------------------------------
  console.log("\nTest Case 1: Registering Rider with Base64 NID...");
  
  // Clean up any existing test rider
  await Rider.deleteOne({ email: "mockrider@test.com" });

  const reqRegister = {
    body: {
      name: "Mock Rider Test",
      email: "mockrider@test.com",
      phone: "01788888888",
      password: "password123",
      vehicleType: "motorcycle",
      nidImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  };

  let registerStatus = 201; // default to 201 success unless status() overrides
  let registerJsonData = null;

  const resRegister = {
    status(code) {
      registerStatus = code;
      return this;
    },
    json(data) {
      registerJsonData = data;
      return this;
    }
  };

  try {
    await authController.registerRider(reqRegister, resRegister);

    console.log(`Response Status: ${registerStatus}`);
    if (registerStatus === 201 && registerJsonData && registerJsonData._id) {
      console.log("✅ Success: Rider registration API succeeded!");
      
      // Query the database to verify the stored record
      const savedRider = await Rider.findById(registerJsonData._id);
      console.log(`Stored NID URL in MongoDB: ${savedRider.nidImage}`);
      
      if (savedRider.nidImage === "https://i.ibb.co/mocked-image-url.png") {
        console.log("✅ Success: Stored URL in MongoDB is correct!");
        passed++;
      } else {
        console.error("❌ Failed: Stored NID image in MongoDB is not the mocked hosted URL");
        failed++;
      }
    } else {
      console.error("❌ Failed: Register API returned an unexpected response", registerJsonData);
      failed++;
    }
  } catch (err) {
    console.error("❌ Error running registerRider test:", err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Case 2: Update Rider NID with Base64 Image
  // -------------------------------------------------------------
  console.log("\nTest Case 2: Updating Rider NID Image...");

  const registeredRider = await Rider.findOne({ email: "mockrider@test.com" });
  if (!registeredRider) {
    console.error("❌ Setup Failed: Test rider was not found for update test");
    failed++;
  } else {
    const reqUpdate = {
      user: { _id: registeredRider._id },
      body: {
        nidImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      }
    };

    let updateStatus = 200; // default to 200 success unless status() overrides
    let updateJsonData = null;

    const resUpdate = {
      status(code) {
        updateStatus = code;
        return this;
      },
      json(data) {
        updateJsonData = data;
        return this;
      }
    };

    try {
      await authController.updateRiderNid(reqUpdate, resUpdate);

      console.log(`Response Status: ${updateStatus}`);
      if (updateJsonData && updateJsonData.nidImage === "https://i.ibb.co/mocked-image-url.png") {
        console.log("✅ Success: Update NID API returned the updated hosted URL!");
        
        // Verify in DB
        const updatedRider = await Rider.findById(registeredRider._id);
        if (updatedRider.nidImage === "https://i.ibb.co/mocked-image-url.png") {
          console.log("✅ Success: Stored URL updated correctly in database!");
          passed++;
        } else {
          console.error("❌ Failed: Stored NID image was not updated in MongoDB");
          failed++;
        }
      } else {
        console.error("❌ Failed: Update API returned incorrect response data", updateJsonData);
        failed++;
      }
    } catch (err) {
      console.error("❌ Error running updateRiderNid test:", err.message);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Case 3: Update Profile Picture with Base64
  // -------------------------------------------------------------
  console.log("\nTest Case 3: Updating Profile Picture...");

  const reqProfilePic = {
    accountType: "rider",
    user: { _id: registeredRider._id },
    body: {
      profilePic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  };

  let picStatus = 200;
  let picJsonData = null;

  const resProfilePic = {
    status(code) {
      picStatus = code;
      return this;
    },
    json(data) {
      picJsonData = data;
      return this;
    }
  };

  try {
    await authController.updateProfilePic(reqProfilePic, resProfilePic);

    console.log(`Response Status: ${picStatus}`);
    if (picJsonData && picJsonData.profilePic === "https://i.ibb.co/mocked-image-url.png") {
      console.log("✅ Success: Update Profile Pic API returned the updated hosted URL!");

      // Verify in DB
      const updatedRider = await Rider.findById(registeredRider._id);
      if (updatedRider.profilePic === "https://i.ibb.co/mocked-image-url.png") {
        console.log("✅ Success: Profile picture URL updated correctly in database!");
        passed++;
      } else {
        console.error("❌ Failed: Profile picture was not updated in MongoDB");
        failed++;
      }
    } else {
      console.error("❌ Failed: Update Profile Pic API returned incorrect response data", picJsonData);
      failed++;
    }
  } catch (err) {
    console.error("❌ Error running updateProfilePic test:", err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Case 4: Register and Login User (verify profilePic is returned)
  // -------------------------------------------------------------
  console.log("\nTest Case 4: Registering and logging in normal User...");
  
  await User.deleteOne({ email: "mockuser@test.com" });

  const reqUserRegister = {
    body: {
      name: "Mock User Test",
      email: "mockuser@test.com",
      phone: "01799999999",
      password: "password123",
      address: "Test Address"
    }
  };

  let userRegStatus = 201;
  let userRegJson = null;

  const resUserRegister = {
    status(code) { userRegStatus = code; return this; },
    json(data) { userRegJson = data; return this; }
  };

  try {
    await authController.registerUser(reqUserRegister, resUserRegister);
    if (userRegStatus === 201 && userRegJson && userRegJson.hasOwnProperty("profilePic")) {
      console.log("✅ Success: User registration API returned profilePic field!");
      passed++;
    } else {
      console.error("❌ Failed: User registration API did not return profilePic field", userRegJson);
      failed++;
    }

    // Now test login
    const reqUserLogin = {
      body: {
        email: "mockuser@test.com",
        password: "password123"
      }
    };

    let userLogStatus = 200;
    let userLogJson = null;

    const resUserLogin = {
      status(code) { userLogStatus = code; return this; },
      json(data) { userLogJson = data; return this; }
    };

    await authController.loginUser(reqUserLogin, resUserLogin);
    if (userLogStatus === 200 && userLogJson && userLogJson.hasOwnProperty("profilePic")) {
      console.log("✅ Success: User login API returned profilePic field!");
      passed++;
    } else {
      console.error("❌ Failed: User login API did not return profilePic field", userLogJson);
      failed++;
    }
  } catch (err) {
    console.error("❌ Error running user auth tests:", err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // Test Case 5: Update User Profile Picture
  // -------------------------------------------------------------
  console.log("\nTest Case 5: Updating User Profile Picture...");

  const registeredUser = await User.findOne({ email: "mockuser@test.com" });
  if (!registeredUser) {
    console.error("❌ Setup Failed: Test user was not found for update test");
    failed++;
  } else {
    const reqUserProfilePic = {
      accountType: "user",
      user: { _id: registeredUser._id },
      body: {
        profilePic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      }
    };

    let userPicStatus = 200;
    let userPicJson = null;

    const resUserProfilePic = {
      status(code) { userPicStatus = code; return this; },
      json(data) { userPicJson = data; return this; }
    };

    try {
      await authController.updateProfilePic(reqUserProfilePic, resUserProfilePic);
      if (userPicStatus === 200 && userPicJson && userPicJson.profilePic === "https://i.ibb.co/mocked-image-url.png") {
        console.log("✅ Success: Update User Profile Pic API returned the updated hosted URL!");

        // Verify in DB
        const updatedUser = await User.findById(registeredUser._id);
        if (updatedUser.profilePic === "https://i.ibb.co/mocked-image-url.png") {
          console.log("✅ Success: User Profile picture URL updated correctly in database!");
          passed++;
        } else {
          console.error("❌ Failed: User Profile picture was not updated in MongoDB");
          failed++;
        }
      } else {
        console.error("❌ Failed: Update User Profile Pic API returned incorrect response data", userPicJson);
        failed++;
      }
    } catch (err) {
      console.error("❌ Error running user updateProfilePic test:", err.message);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Case 6: Input Validation Edge Cases (Expect 400 rejection)
  // -------------------------------------------------------------
  console.log("\nTest Case 6: Verifying Input Validation Edge Cases...");

  const badInputs = [
    {
      label: "Short Name",
      body: { name: "A", email: "valid@test.com", phone: "01711111111", password: "password123" }
    },
    {
      label: "Bad Email",
      body: { name: "Valid Name", email: "invalid-email", phone: "01711111111", password: "password123" }
    },
    {
      label: "Bad Phone Number",
      body: { name: "Valid Name", email: "valid@test.com", phone: "12345", password: "password123" }
    },
    {
      label: "Short Password",
      body: { name: "Valid Name", email: "valid@test.com", phone: "01711111111", password: "123" }
    }
  ];

  for (const { label, body } of badInputs) {
    let reqStatus = 200;
    let reqJson = null;

    const mockRes = {
      status(code) { reqStatus = code; return this; },
      json(data) { reqJson = data; return this; }
    };

    try {
      await authController.registerUser({ body }, mockRes);
      if (reqStatus === 400) {
        console.log(`✅ Success: Rejected ${label} correctly with status 400 (${reqJson.message})`);
        passed++;
      } else {
        console.error(`❌ Failed: Did not reject ${label} correctly. Status: ${reqStatus}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error running validation test for ${label}:`, err.message);
      failed++;
    }
  }

  // Clean up
  console.log("\nCleaning up test data...");
  await Rider.deleteOne({ email: "mockrider@test.com" });
  await User.deleteOne({ email: "mockuser@test.com" });
  
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");

  console.log("\n═══════════════════════════════════════════════");
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
