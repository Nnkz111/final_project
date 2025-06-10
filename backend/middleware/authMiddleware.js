const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET; // Use environment variable for JWT secret

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token from 'Bearer TOKEN' format

  if (token == null) {
    return res.sendStatus(401); // If there is no token, return unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err); // Debugging line
      return res.sendStatus(403); // If token is invalid, return forbidden
    }
    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
