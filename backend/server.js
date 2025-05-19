// Import the express library
const express = require("express");

// Create an Express application
const app = express();

// Define the port to run the server on
const port = process.env.PORT || 5000;

// Define a basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
