const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const cors = require('cors');

const userRouter = require('./routes/user-route')
const verifyRouter = require('./routes/verifyOtp-route')
const authCheckRouter = require('./routes/authCheck-route');
const ownerRouter = require('./routes/owner-route');
const adminRouter= require('./routes/admin-route')


const PORT = process.env.PORT || 10000;


app.use(express.json());


const allowedOrigins = [
  'https://gametrack-sigma.vercel.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); // ← see what’s hitting your server
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));


app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running...");
});


const connectDB = require('./db/db');
const turfRouter = require('./routes/turf-route');

app.use('/api', userRouter, authCheckRouter, turfRouter);
app.use('/owner', ownerRouter);
app.use('/otp', verifyRouter)
app.use("/admin", adminRouter)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

connectDB()






