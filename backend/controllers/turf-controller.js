const Owner = require("../models/owner-model")
const Turf = require("../models/turf-model")
const cron = require("node-cron")

const fetchAllTurfs = async () => {
  let turfs = await Turf.find(
    {},
    "name bookedSlots sportsAvailable createdAt averageRating images location dayPrice nightPrice openingTime closingTime"
  );

  if (!turfs || turfs.length === 0) {
    return null;
  }

  turfs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return turfs;
};

const getAllTurfs = async (req, res) => {
  try {
    const turfs = await fetchAllTurfs();
    if (!turfs) {
      return res.status(404).json({ message: "No turfs found" });
    }
    res.status(200).json(turfs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load turfs", error });
  }
};

cron.schedule("*/15 * * * *", async () => {
  try {
    const turfs = await fetchAllTurfs();
    if (turfs) {
      console.log(`[CRON] Warmed up DB: ${turfs.length} turfs`);
    } else {
      console.log("[CRON] No turfs found in DB");
    }
  } catch (error) {
    console.error("[CRON] Error fetching turfs:", error);
  }
});

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

const addSubscriptionSlot = async (req, res) => {
  try {
    const { turfId, days, amount, desc } = req.body;
    console.log("Adding subscription slot:", req.body);
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    turf.subscription.push({ days, amount, desc });
    await turf.save();
    res.status(200).json({ message: "Subscription slot added successfully" });
  } catch (error) {
    console.error("Error adding subscription slot:", error);
    res.status(500).json({ message: "Internal server error", error });
  } 
};

const updateSubscription = async (req, res) => {
  try {
    const { turfId, planId, days, amount, desc } = req.body;
    console.log("Updating subscription slot:", req.body);
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    const subscription = turf.subscription.id(planId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription slot not found" });
    } 
    subscription.days = days;
    subscription.amount = amount;
    subscription.desc = desc;
    await turf.save();
    res.status(200).json({ message: "Subscription slot updated successfully" });
  }
  catch (error) {
    console.error("Error updating subscription slot:", error);
    res.status(500).json({ message: "Internal server error", error });
  } 
};

const deleteSubscription = async (req, res) => {
  try {
    const { turfId, planId } = req.body;
    console.log("Deleting subscription slot:", req.body);
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    const subscription = turf.subscription.id(planId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription slot not found" });
    }
    subscription.remove();
    await turf.save();
    res.status(200).json({ message: "Subscription slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription slot:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


module.exports={
    getAllTurfs,
    getSingleTurf,
    getSiblingTurf,
    addSubscriptionSlot,
    updateSubscription,
    deleteSubscription

}