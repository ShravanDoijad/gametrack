const express = require('express');
const turfRouter = express.Router();
const turfController = require('../controllers/turf-controller');
// const { userMiddleware } = require('../middleware/authMiddleware');

turfRouter.get('/getAllTurfs', turfController.getAllTurfs);
turfRouter.get('/getSingleTurf', turfController.getSingleTurf);
turfRouter.get("/getSiblingTurf", turfController.getSiblingTurf)
// turfRouter.post('/book', userMiddleware, turfController.bookTurf);
// turfRouter.post('/:id/review', userMiddleware, turfController.addReview);

module.exports = turfRouter