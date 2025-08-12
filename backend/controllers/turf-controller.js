const Owner = require("../models/owner-model")
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
const getSiblingTurf = async (req,res) => {
  try {
    const {turfId} = req.query
    const turf = await Turf.findById(turfId)
    const owner = await Owner.findById(turf.owner).populate("turfIds")
    if(!owner){
        return res.status(400).json("Owner Not Found")
    }
   
    res.status(200).json({turfs: owner.turfIds})
  } catch (error) {
    console.log("Can't fetch turfs", error)
    res.status(500).json({message:"Can't fetch the Turfs"})
  }
}

module.exports={
    getAllTurfs,
    getSingleTurf,
    getSiblingTurf
}