const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/admin-controller'); 
const upload = require('../middleware/multer');
const { adminMiddleware } = require('../middleware/authMiddleware');

adminRouter.post('/adminLogin', adminController.adminLogin);
adminRouter.post('/adminLogout', adminMiddleware, adminController.adminLogout);
adminRouter.post('/addTurf', adminMiddleware, upload.array("images", 3), adminController.addTurf);
adminRouter.get('/getAllTurfs', adminMiddleware, adminController.getAllTurfs);
adminRouter.get('/getAllUsers', adminMiddleware, adminController.getAllUsers);
adminRouter.get('/getAllBookings', adminMiddleware, adminController.getAllBookings);
adminRouter.get('/adminAuth', adminController.adminAuthCheck);


module.exports = adminRouter;