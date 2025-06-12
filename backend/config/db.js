const { Pool } = require("pg");

let pool;

if (process.env.DATABASE_URL) {
  console.log("Configuring database connection for production...");
  const connectionString = process.env.DATABASE_URL;
  console.log(
    "Database URL format check:",
    connectionString.startsWith("postgresql://")
      ? "Valid format"
      : "Invalid format"
  );

  // Production configuration with SSL
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 2, // Reduced for free tier
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout further
  });
} else {
  // Development configuration
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection error details:", {
      code: err.code,
      message: err.message,
      stack: err.stack,
    });
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Database connected successfully!");
  release();
});

module.exports = pool;
