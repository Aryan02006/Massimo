// Script to add new products to the Massimo restaurant menu
// Run: node seed-new-products.js

const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/massimo";

const newProducts = [
  // === PASTAS (3 new) ===
  {
    id: 10,
    title: "Classic Carbonara",
    desc: "A Roman masterpiece featuring silky spaghetti tossed in a luscious egg and Pecorino Romano sauce, studded with crispy guanciale and finished with a generous crack of black pepper.",
    img: "/temporary/p13.jpg",
    price: 27.9,
    catSlug: "pastas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 11,
    title: "Pesto Penne Primavera",
    desc: "Vibrant penne coated in a fragrant house-made basil pesto, tossed with cherry tomatoes, toasted pine nuts, and shaved Parmigiano-Reggiano for a fresh and herbaceous delight.",
    img: "/temporary/p14.jpg",
    price: 25.9,
    catSlug: "pastas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 12,
    title: "Seafood Fettuccine",
    desc: "Indulge in ocean-fresh fettuccine loaded with succulent shrimp, tender mussels, and garlic in a velvety white wine cream sauce, garnished with fresh parsley and a squeeze of lemon.",
    img: "/temporary/p15.jpg",
    price: 34.9,
    catSlug: "pastas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },

  // === BURGERS (3 new) ===
  {
    id: 13,
    title: "Truffle Mushroom Burger",
    desc: "An elevated gourmet experience featuring a juicy beef patty topped with sautéed wild mushrooms, melted Gruyère cheese, caramelized onions, fresh arugula, and a luxurious truffle aioli on a brioche bun.",
    img: "/temporary/p16.jpg",
    price: 33.9,
    catSlug: "burgers",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 14,
    title: "BBQ Smokehouse",
    desc: "A smoky sensation loaded with a flame-grilled beef patty, crispy onion rings, aged cheddar cheese, crunchy pickles, and a rich hickory barbecue sauce on a toasted sesame bun.",
    img: "/temporary/p17.jpg",
    price: 31.9,
    catSlug: "burgers",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 15,
    title: "Double Classic Smash",
    desc: "The ultimate classic — two thin-smashed beef patties with double American cheese, fresh tomato, crispy lettuce, dill pickles, ketchup, and mustard on a soft sesame seed bun.",
    img: "/temporary/p18.jpg",
    price: 28.9,
    catSlug: "burgers",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },

  // === PIZZAS (3 new) ===
  {
    id: 16,
    title: "BBQ Chicken Ranch",
    desc: "A crowd favorite topped with smoky BBQ grilled chicken, sliced red onions, fresh cilantro, melted mozzarella, and a drizzle of tangy ranch dressing on a hand-tossed crust.",
    img: "/temporary/p19.jpg",
    price: 28.9,
    catSlug: "pizzas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 17,
    title: "Pepperoni Supreme",
    desc: "A timeless classic loaded with generous layers of premium pepperoni, rich tomato sauce, and bubbly mozzarella cheese on a perfectly crispy crust — simple perfection in every slice.",
    img: "/temporary/p20.jpg",
    price: 26.9,
    catSlug: "pizzas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
  {
    id: 18,
    title: "Quattro Formaggi",
    desc: "A cheese lover's dream featuring a heavenly blend of mozzarella, gorgonzola, Parmigiano-Reggiano, and fontina cheese, finished with fresh basil leaves and a golden drizzle of honey.",
    img: "/temporary/p21.jpg",
    price: 30.9,
    catSlug: "pizzas",
    options: [
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 4 },
      { title: "Large", additionalPrice: 6 },
    ],
  },
];

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("Massimo");

  // Check for existing products to avoid duplicates
  const existing = await db.collection("products").find({}).toArray();
  const existingTitles = new Set(existing.map((p) => p.title));

  let inserted = 0;
  let skipped = 0;

  for (const product of newProducts) {
    if (existingTitles.has(product.title)) {
      console.log(`⏭️  Skipped "${product.title}" (already exists)`);
      skipped++;
    } else {
      await db.collection("products").insertOne(product);
      console.log(
        `✅ Added "${product.title}" -> ${product.catSlug} ($${product.price})`,
      );
      inserted++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);

  // Summary
  const pastas = await db
    .collection("products")
    .countDocuments({ catSlug: "pastas" });
  const burgers = await db
    .collection("products")
    .countDocuments({ catSlug: "burgers" });
  const pizzas = await db
    .collection("products")
    .countDocuments({ catSlug: "pizzas" });
  console.log(
    `\nMenu totals: ${pastas} pastas, ${burgers} burgers, ${pizzas} pizzas (${pastas + burgers + pizzas} total)`,
  );

  await client.close();
}

main().catch(console.error);
