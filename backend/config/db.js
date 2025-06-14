const { Pool } = require("pg");

let pool;
let isConnected = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

// Retry mechanism for database operations
const withRetry = async (operation, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Attempt ${i + 1} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

// Health check function
const checkConnection = async () => {
  if (!isConnected) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      isConnected = true;
      console.log("Database connection established");
    } catch (err) {
      isConnected = false;
      console.error("Database connection check failed:", err.message);
      throw err;
    }
  }
};

// Run health check periodically
setInterval(async () => {
  try {
    await checkConnection();
  } catch (err) {
    console.error("Health check failed:", err.message);
  }
}, 30000); // Check every 30 seconds

if (process.env.DATABASE_URL) {
  console.log("Configuring database connection for production...");
  const connectionString = process.env.DATABASE_URL;
  console.log(
    "Database URL format check:",
    connectionString.startsWith("postgresql://")
      ? "Valid format"
      : "Invalid format"
  );
  // Production configuration with SSL and connection management
  pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 3, // Slightly increased but still suitable for free tier
    min: 1, // Maintain at least one connection
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    strategy: "keep-alive", // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
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
