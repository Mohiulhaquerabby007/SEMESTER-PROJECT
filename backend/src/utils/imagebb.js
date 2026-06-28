const axios = require("axios");

/**
 * Uploads a base64 encoded image to ImageBB.
 * 
 * @param {string} base64Image - Base64 encoded image (with or without data prefix)
 * @returns {Promise<string>} The hosted image URL from ImageBB
 */
const uploadToImageBB = async (base64Image) => {
  if (!base64Image || typeof base64Image !== "string" || base64Image.trim() === "") {
    throw new Error("Image data is required and must be a non-empty string");
  }

  // 1. Strip the prefix (e.g., "data:image/webp;base64,") if present
  let base64Data = base64Image;
  if (base64Image.includes(";base64,")) {
    base64Data = base64Image.split(";base64,")[1];
  }

  // Remove whitespaces and newlines
  const cleanBase64 = base64Data.replace(/\s/g, "");

  // 2. Validate base64 structure
  // Base64 characters are A-Z, a-z, 0-9, +, /, and = (for padding)
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw new Error("Invalid image format: String is not a valid base64 representation");
  }

  // 3. Retrieve and validate API Key
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("ImageBB API key is not configured in the environment variables");
  }

  try {
    // 4. Construct urlencoded request body using URLSearchParams
    const params = new URLSearchParams();
    params.append("image", cleanBase64);

    // 5. Send POST request to ImageBB endpoint
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 15000, // 15 seconds timeout
      }
    );

    // 6. Return the hosted image URL from the response
    if (response.data && response.data.success && response.data.data && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error(response.data?.error?.message || "Failed to retrieve hosted image URL");
    }
  } catch (error) {
    // Extract a precise error message
    const errorMsg =
      error.response?.data?.error?.message ||
      error.message ||
      "Unknown error uploading image to ImageBB";
    console.error("ImageBB API Upload Error:", errorMsg);
    throw new Error(`ImageBB Upload Failed: ${errorMsg}`);
  }
};

module.exports = { uploadToImageBB };
