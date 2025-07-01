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


const port = 3000;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], 
  credentials: true
}));
app.use(cookieParser());

const connectDB = require('./db/db');
const turfRouter = require('./routes/turf-route');

app.use('/api', userRouter, authCheckRouter, turfRouter);
app.use('/owner', ownerRouter);
app.use('/otp', verifyRouter)
app.use("/admin", adminRouter)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

connectDB()






