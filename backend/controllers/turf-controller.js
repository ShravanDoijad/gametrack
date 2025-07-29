const Turf = require("../models/turf-model")

const getAllTurfs = async(req, res)=>{
    try {
        const turfs = await Turf.find({})
       res.status(200).json(turfs)
    } catch (error) {
        res.status(500).json({message: "Enable Load turfs", error: error})
    }
   
}

const getSingleTurf = async (req, res)=>{
    try {
        const {id} = req.query 
        const turf = await Turf.findById(id);
         res.status(200).json({turf:turf})
        
    } catch (error) {
        console.log("can't get turf",error )
        res.status(500).json({message:"Internal Server error", error: error})
        
    }
}

module.exports={
    getAllTurfs,
    getSingleTurf
}