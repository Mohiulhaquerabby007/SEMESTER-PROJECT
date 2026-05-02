require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Read MONGODB_URI from environment variables.
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// We are building a Parcel Delivery Platform.
const dbName = "quickdrop";
const collectionName = "parcels";

async function run() {
  console.log("Starting data seeding process...");

  try {
    // Connect to the server
    await client.connect();
    console.log("✅ Successfully connected to MongoDB.");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Create 10 realistic documents representing parcel deliveries
    // Each includes a real timestamp field with slightly different times
    const baseTime = Date.now();
    const documentsToInsert = [
      { trackingId: "PK-1001", status: "pending", weight: 2.5, createdAt: new Date(baseTime - 100000) },
      { trackingId: "PK-1002", status: "in_transit", weight: 1.2, createdAt: new Date(baseTime - 200000) },
      { trackingId: "PK-1003", status: "delivered", weight: 5.0, createdAt: new Date(baseTime - 300000) },
      { trackingId: "PK-1004", status: "pending", weight: 0.5, createdAt: new Date(baseTime - 400000) },
      { trackingId: "PK-1005", status: "cancelled", weight: 10.0, createdAt: new Date(baseTime - 500000) },
      { trackingId: "PK-1006", status: "in_transit", weight: 3.4, createdAt: new Date(baseTime - 600000) },
      { trackingId: "PK-1007", status: "pending", weight: 2.1, createdAt: new Date(baseTime - 700000) },
      { trackingId: "PK-1008", status: "delivered", weight: 1.8, createdAt: new Date(baseTime - 800000) },
      { trackingId: "PK-1009", status: "in_transit", weight: 4.2, createdAt: new Date(baseTime - 900000) },
      { trackingId: "PK-1010", status: "delivered", weight: 0.8, createdAt: new Date(baseTime - 1000000) }
    ];

    // Insert the documents into the collection
    const result = await collection.insertMany(documentsToInsert);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} documents.`);
    console.log("Inserted Document IDs:");
    
    // Print out the IDs of the inserted documents so the beginner can verify
    Object.values(result.insertedIds).forEach((id, index) => {
      console.log(`  Document ${index + 1}: ${id}`);
    });

  } catch (error) {
    // Handle potential errors during connection or insertion
    console.error("❌ An error occurred during seeding.");
    console.error(error.message);
  } finally {
    // Always close the connection when done
    console.log("Closing connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

run().catch(console.dir);
