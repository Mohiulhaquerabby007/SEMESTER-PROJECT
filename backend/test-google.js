const axios = require("axios");

async function test() {
  try {
    const res = await axios.post("http://127.0.0.1:5005/api/auth/google-login", {
      token: "fake_token"
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR STATUS:", err.response?.status);
    console.log("ERROR DATA:", err.response?.data);
    console.log("ERROR MSG:", err.message);
  }
}

test();
