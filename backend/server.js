const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Load environment variables
dotenv.config();

const connectDB = require('./db/db');
const userRouter = require('./routes/user-route');
const verifyRouter = require('./routes/verifyOtp-route');
const authCheckRouter = require('./routes/authCheck-route');
const ownerRouter = require('./routes/owner-route');
const adminRouter = require('./routes/admin-route');
const turfRouter = require('./routes/turf-route');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔍 Log every incoming origin request BEFORE CORS
app.use((req, res, next) => {
  console.log("🔥 Incoming request from Origin:", req.headers.origin);
  next();
});

// ✅ CORS Setup
const allowedOrigins = [
  "https://gametrack-sigma.vercel.app",
  "https://gametrack-lhzg92l2o-shravans-projects-00476bc1.vercel.app",
  "http://localhost:5173",
   // <- allow requests with no origin
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("⛔ Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// 🧠 JSON + Cookie middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 API is live...");
});

// 📦 Mount routers (use clean base paths)


app.use('/otp', verifyRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authCheckRouter);
app.use('/api/turfs', turfRouter);

app.use('/owner', ownerRouter);
app.use('/admin', adminRouter);

// 🚀 Start server
app.listen(PORT, () => {
  
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});

// 🧬 DB connection
connectDB();
