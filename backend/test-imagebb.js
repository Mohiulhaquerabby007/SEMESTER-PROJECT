require("dotenv").config();
const { uploadToImageBB } = require("./src/utils/imagebb");

// A valid 1x1 transparent PNG base64 string
const VALID_BASE64_WITH_PREFIX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const VALID_BASE64_WITHOUT_PREFIX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const INVALID_BASE64_CHARS = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==_INVALID_CHARS!!!";

async function testUploader() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Testing ImageBB Upload Utility & Validation  ");
  console.log("═══════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Upload with valid base64 (with prefix)
  try {
    console.log("Test 1: Uploading valid base64 image (with prefix)...");
    const url = await uploadToImageBB(VALID_BASE64_WITH_PREFIX);
    console.log(`✅ Success! Hosted URL: ${url}`);
    if (url && url.startsWith("https://")) {
      passed++;
    } else {
      console.error("❌ Failed: Returned URL did not start with https://");
      failed++;
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    failed++;
  }
  console.log("");

  // Test 2: Upload with valid base64 (without prefix)
  try {
    console.log("Test 2: Uploading valid base64 image (without prefix)...");
    const url = await uploadToImageBB(VALID_BASE64_WITHOUT_PREFIX);
    console.log(`✅ Success! Hosted URL: ${url}`);
    if (url && url.startsWith("https://")) {
      passed++;
    } else {
      console.error("❌ Failed: Returned URL did not start with https://");
      failed++;
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    failed++;
  }
  console.log("");

  // Test 3: Upload with empty image string
  try {
    console.log("Test 3: Validating empty/null base64 check...");
    await uploadToImageBB("");
    console.error("❌ Failed: Should have rejected empty base64 string");
    failed++;
  } catch (error) {
    console.log(`✅ Success! Correctly rejected: ${error.message}`);
    passed++;
  }
  console.log("");

  // Test 4: Upload with invalid base64 characters
  try {
    console.log("Test 4: Validating malformed base64 checks...");
    await uploadToImageBB(INVALID_BASE64_CHARS);
    console.error("❌ Failed: Should have rejected malformed base64 chars");
    failed++;
  } catch (error) {
    console.log(`✅ Success! Correctly rejected: ${error.message}`);
    passed++;
  }
  console.log("");

  console.log("═══════════════════════════════════════════════");
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════");

  process.exit(failed > 0 ? 1 : 0);
}

testUploader().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
