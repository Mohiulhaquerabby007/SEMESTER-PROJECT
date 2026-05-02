require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Read MONGODB_URI from environment variables. 
// Fallback to a placeholder if not set (which will fail intentionally so the user knows to set it).
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  console.log("Starting connection check...");
  
  try {
    // Attempt to connect the client to the server
    await client.connect();
    console.log("✅ Successfully connected to the MongoDB server.");

    // Send a lightweight ping command to the 'admin' database to verify connectivity
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping successful! Your MongoDB Atlas deployment is fully accessible.");
    
  } catch (error) {
    // Catch and print any connection or ping errors clearly
    console.error("❌ Failed to connect or ping MongoDB.");
    console.error("Error details:", error.message);
    console.error("Please ensure your MONGODB_URI is correct and your IP is whitelisted in Atlas.");
  } finally {
    // Ensures that the client will close when you finish or if an error occurs
    console.log("Closing connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

// Execute the run function
run().catch(console.dir);
