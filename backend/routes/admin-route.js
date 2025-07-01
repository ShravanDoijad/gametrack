const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/admin-controller'); 
const upload = require('../middleware/multer');
const { adminMiddleware } = require('../middleware/authMiddleware');



adminRouter.post('/adminLogin', adminController.adminLogin);
adminRouter.post('/adminLogout',adminMiddleware, adminController.adminLogout);
adminRouter.post('/addTurf',adminMiddleware, upload.array("images", 3)
, adminController.addTurf)





module.exports= adminRouter