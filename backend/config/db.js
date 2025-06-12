const { Pool } = require("pg");

let pool;

if (process.env.DATABASE_URL) {
  console.log("Configuring database connection for production...");
  // Production configuration with SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
    max: 2, // Reduced for free tier
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout
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
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Database connected successfully!");
  release();
});

module.exports = pool;
