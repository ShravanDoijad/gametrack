const express = require('express');
const turfRouter = express.Router();
const turfController = require('../controllers/turf-controller');
// const { userMiddleware } = require('../middleware/authMiddleware');

turfRouter.get('/getAllTurfs', turfController.getAllTurfs);
turfRouter.get('/getSingleTurf', turfController.getSingleTurf);
turfRouter.get("/getSiblingTurf", turfController.getSiblingTurf)
turfRouter.post("/add-subscription", turfController.addSubscriptionSlot)
turfRouter.put("/update-subscription", turfController.updateSubscription)
turfRouter.delete("/delete-subscription", turfController.deleteSubscription)
turfRouter.get("/get-reviews", turfController.getReviews)


// turfRouter.post('/book', userMiddleware, turfController.bookTurf);
// turfRouter.post('/:id/review', userMiddleware, turfController.addReview);

module.exports = turfRouter