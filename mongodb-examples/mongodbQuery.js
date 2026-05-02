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

// Use the same database and collection from our seed step
const dbName = "quickdrop";
const collectionName = "parcels";

async function run() {
  console.log("Starting query execution...");

  try {
    // Connect to the server
    await client.connect();
    console.log("✅ Successfully connected to MongoDB.");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Filter field specified: 'status'
    // Let's find all parcels that have a status of "pending"
    const filter = { status: "pending" };

    console.log(`\n🔍 Querying documents where status is "pending"...`);
    
    // Execute a simple find query and convert the cursor results to an array
    const results = await collection.find(filter).toArray();

    if (results.length === 0) {
      console.log("No documents matched the query.");
    } else {
      console.log(`Found ${results.length} matching document(s):`);
      // Print the full documents for clarity
      console.dir(results, { depth: null });
    }

    // Creating an index to support our query pattern
    console.log(`\n⚙️ Creating an index on the "status" field...`);
    
    // Create an index on { status: 1 } (1 for ascending order)
    const indexName = await collection.createIndex({ status: 1 });
    
    console.log(`✅ Index created successfully: ${indexName}`);
    console.log(`💡 Explanation: We frequently query parcels by their "status" (e.g., to find all "pending" orders).`);
    console.log(`   Creating an index on this field prevents MongoDB from having to scan every single document`);
    console.log(`   in the collection (a collection scan), making the query extremely fast as the app scales.`);

  } catch (error) {
    // Handle potential errors during connection, querying, or indexing
    console.error("❌ An error occurred during the query operation.");
    console.error(error.message);
  } finally {
    // Always close the connection when done
    console.log("\nClosing connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

run().catch(console.dir);
