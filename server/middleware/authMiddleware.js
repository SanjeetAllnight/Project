const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/env");

function authenticateRequest(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token required.",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

module.exports = {
  authenticateRequest,
};
