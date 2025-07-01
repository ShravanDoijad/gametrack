const jwt = require('jsonwebtoken')


const userMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.userToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized, Login First" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: " Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Please log in again." });
    }

    console.error("User Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const adminMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized! Token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      decoded.email !== process.env.ADMIN_EMAIL ||
      decoded.password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: 'Unauthorized! Please login first.' });
    }

    next();
  } catch (error) {
    console.log('admin authentication error', error.message);
    return res.status(401).json({ message: 'Unauthorized! Invalid or expired token.' });
  }
};



module.exports = {
    userMiddleware,
    adminMiddleware
}