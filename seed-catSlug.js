// Script to add catSlug field to all products in MongoDB
// Run: node seed-catSlug.js

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/massimo";

const categoryMap = {
  // Pizzas
  "Sicilian": "pizzas",
  "Bella Napoli": "pizzas",
  "Margherita Magic": "pizzas",
  "Mediterranean Delight": "pizzas",

  // Pastas
  "Spicy Arrabbiata": "pastas",
  "Garlic Parmesan Linguine": "pastas",

  // Burgers
  "Bacon Deluxe": "burgers",
  "Jalapeño Fiesta": "burgers",
  "Hawaiian Teriyaki": "burgers",
};

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("Massimo");

  const products = await db.collection("products").find({}).toArray();

  for (const product of products) {
    const catSlug = categoryMap[product.title];
    if (catSlug) {
      await db.collection("products").updateOne(
        { _id: product._id },
        { $set: { catSlug } }
      );
      console.log(`✅ "${product.title}" -> catSlug: "${catSlug}"`);
    } else {
      console.log(`⚠️  No mapping for "${product.title}"`);
    }
  }

  console.log("\nDone! All products updated.");
  await client.close();
}

main().catch(console.error);
