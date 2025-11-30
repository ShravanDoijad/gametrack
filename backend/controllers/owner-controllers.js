const { sendOtp } = require("./otp-controller");
const { validationResult } = require('express-validator');
const Owner = require("../models/owner-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const Turf = require("../models/turf-model")
const bcrypt = require('bcryptjs');
const Subscription = require("../models/subscription-model");
const { sendMessage, OwnerUpdate } = require('../twilio/sendMessage');
const PDFDocument = require('pdfkit');

const ownerRegister = async (req, res) => {
  try {
    const { fullname, email, phone, turfIds, turfname } = req.body;

    // Basic validation
    if (!fullname?.trim() || !email?.trim() || !phone?.trim() || !Array.isArray(turfIds) || turfIds.length === 0 || !turfname?.trim()) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and turfIds must be a non-empty array",
      });
    }

    // Check if owner already exists
    const existingOwner = await Owner.findOne({
      $or: [{ email: email.trim() }, { phone: phone.trim() }],
    });

    if (existingOwner) {
      return res.status(409).json({
        success: false,
        message: "Owner already exists with this email or phone",
      });
    }

    // Create owner
    const newOwner = new Owner({
      fullname: fullname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      turfIds,
      turfname: turfname.trim(),
    });

    await newOwner.save();

    return res.status(201).json({
      success: true,
      message: "Owner registered successfully",
      owner: {
        id: newOwner._id,
        fullname: newOwner.fullname,
        email: newOwner.email,
        phone: newOwner.phone,
        turfIds: newOwner.turfIds,
        turfname: newOwner.turfname,
      },
    });
  } catch (error) {
    console.error("Owner registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};





const turfAllBookings = async (req, res) => {
    try {
        const { turfId } = req.query

        if (!turfId) {
            return res.status(400).json({ success: false, message: "Turf ID is required" });
        }

        let bookings = await Booking.find({ turfId: turfId }).populate('userId', 'fullname email phone');

        

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error fetching turf bookings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const getCustomers = async (req, res) => {
    try {
        const { turfId } = req.query;
        const turf = await Turf.findById(turfId)
        if (!turf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }
        const bookings = await Booking.find({ turfId: turf._id }).populate('userId', 'name email phone');

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ success: false, message: "No bookings found for this turf" });
        }


        const customers = bookings
            .filter((booking) => booking.userId !== null)
            .map((booking) => ({
                userId: booking.userId._id,
                name: booking.userId.fullname || "Geust",
                email: booking.userId.email || "N/A",
                phone: booking.userId.phone || "N/A",
                bookingDate: booking.date,
                slots: booking.slots,
                amountPaid: booking.amountPaid,
                paymentType: booking.paymentType,
                status: booking.status,
                bookingCreatedAt: booking.createdAt,
            }));


        res.status(200).json({ success: true, customers });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ success: false, message: "Internal server error" });

    }

}

const getTurfDetails = async (req, res) => {
    try {
        const { data: owner, role } = req.auth;
        const {turfId} = req.query
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }
        res.status(200).json({ success: true, turf, owner });
    } catch (error) {
        console.error("Error fetching turf details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateTurfProfile = async (req, res) => {
    try {
        const { data: owner, role } = req.auth;
        const {turfId} = req.query;
        const turfData = req.body;

        const updatedTurf = await Turf.findByIdAndUpdate(turfId, turfData, { new: true });
        if (!updatedTurf) {
            return res.status(404).json({ success: false, message: "Turf not found" });
        }

        res.status(200).json({ success: true, turf: updatedTurf });
    } catch (error) {
        console.error("Error updating turf profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const getOwnedTurfs = async (req, res) => {
    try {
        const { data: owner, role } = req.auth;
        if (!owner || !owner.turfIds.length>0) {
            return res.status(400).json({ success: false, message: "Owner or Turf ID not found" });
        }
        const turfs = await Turf.find({ owner: owner._id });
        if (!turfs || turfs.length === 0) {
            return res.status(404).json({ success: false, message: "No turfs found" });
        }
        res.status(200).json({ success: true, turfs });
    } catch (error) {
        console.error("Error fetching turfs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const dashboardDetails = async (req, res) => {
    try {
        const { turfId } = req.query
        if (!turfId) {
            return res.status(400).json({ success: false, message: "Turf ID is required" });
        }
        const bookings = await Booking.find({ turfId: turfId })
        const details = []
        bookings.forEach((booking) => {
            details.push({
                userId: booking.userId,
                date: booking.date,
                slots: booking.slots,
                slotFees: booking.slotFees,
                amountPaid: booking.amountPaid,
                paymentType: booking.paymentType,
                status: booking.status,
                createdAt: booking.createdAt
            })
        })
        res.status(200).json({ success: true, details });
    }
    catch {
        console.error("Error fetching dashboard details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const updateOwner = async (req, res) => {
    try {
        const { ownerId, fcmToken } = req.body;

        if (!ownerId || !fcmToken) {
            return res.status(400).json({ success: false, message: "Missing data" });
        }

        await Owner.findByIdAndUpdate(ownerId, {
            $addToSet: { fcmTokens: fcmToken },
        });
        res.json({ success: true });
    } catch (error) {
        console.error("🔥 Update Owner Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};



const getAvailableSlots = async (req, res) => {
  try {
    const { turfId, date } = req.query;

    if (!date) return res.status(400).json({ error: "Date is required." });

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ error: "Turf not found." });

    const { openingTime, closingTime, bookedSlots } = turf;

    const allSlots = generateSlots(openingTime, closingTime);
    const bookedDay = bookedSlots.find((s) => s.date === date);
    const bookedTime = bookedDay?.slots || [];

    const slotsWithStatus = allSlots.map((slot) => {
      const isBooked = bookedTime.some(
        (b) =>
          (slot.start >= b.start && slot.start < b.end) ||
          (slot.end > b.start && slot.end <= b.end) ||
          (slot.start <= b.start && slot.end >= b.end)
      );

      return {
        ...slot,
        status: isBooked ? "booked" : "available",
      };
    });

    res.json({ slots: slotsWithStatus });
  } catch (err) {
    console.error("Error getting slots:", err);
    res.status(500).json({ error: "Server error" });
  }
};



function generateSlots(openingTime, closingTime) {
    const slots = [];
    let [hour, minute] = openingTime.split(":").map(Number);
    const [endHour, endMinute] = closingTime.split(":").map(Number);

    while (hour < endHour || (hour === endHour && minute < endMinute)) {
        const startHour = hour.toString().padStart(2, "0");
        const startMin = minute.toString().padStart(2, "0");

        hour += 1;

        const endHourStr = hour.toString().padStart(2, "0");
        const endMin = startMin;

        slots.push({
            start: `${startHour}:${startMin}`,
            end: `${endHourStr}:${endMin}`,
            _id: `${startHour}${startMin}-${endHourStr}${endMin}` // string ID
        });
    }

    return slots;
}

const addManualBooking = async (req, res) => {
  try {
    let {phone, fullname, advanceAmount ,date, start, end, turfId, slotFees, newStatus} = req.body

    if(!phone || !fullname ){
      res.status(400).json({message:" All fields are Required"})
    }
    if(!advanceAmount){
      advanceAmount = 0;
    }
    const turf = await Turf.findById(turfId).populate('owner', 'phone');
   
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    let day = turf.bookedSlots.find((d) => d.date === date);

        if (newStatus === "booked") {
      
      if (day) {
        const hasOverlap = day.slots.some(
          (slot) =>
            (start >= slot.start && start < slot.end) ||
            (end > slot.start && end <= slot.end) ||
            (start <= slot.start && end >= slot.end) 
        );
        if (hasOverlap) {
          return res.status(409).json({ message: "This slot overlaps with an already booked slot." });
        }
        day.slots.push({ start, end });
      } else {
       
        turf.bookedSlots.push({
          date,
          slots: [{ start, end }],
        });


      }
    } else if (newStatus === "available") {
      // Make available: remove from turf.bookedSlots and update booking collection status
      if (!day) return res.status(404).json({ message: "No booked slots for this date" });

      const index = day.slots.findIndex((s) => s.start === start && s.end === end);
      if (index === -1) return res.status(404).json({ message: "Slot not found" });

      // Remove from turf's booked slots
      day.slots.splice(index, 1);
      if (day.slots.length === 0) {
        turf.bookedSlots = turf.bookedSlots.filter((d) => d.date !== date);
      }

      // Also update booking document status to "cancelled"
      await Booking.updateOne(
        {
          turfId,
          date,
          "slots.start": start,
          "slots.end": end,
          status: "confirmed"
        },
        { $set: { status: "cancelled" } }
      );
    }

    await turf.save();
    
    const newManualBooking = await Booking.create({
      turfId:turfId,
      fullname:fullname,
      phone:phone,
      date:date,
      amountPaid:advanceAmount,
      slotFees:slotFees,
      paymentType:"Manual"
      
    })
    

     newManualBooking.slots.push({
      start:start,
      end:end
    })
    
    await newManualBooking.save()
     const slotTimeText = `${start} - ${end}`;

     const timeStringToMinutes = time => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
     await sendMessage({
            phoneNumber: phone,
            notification_data: {
              name: fullname.split(" ")[0],               
              turfName: turf.name,                                 
              date: new Date(date).toDateString(),                           
              time: slotTimeText,                                  
              location: turf.location.city,                        
              amount:slotFees,                                  
              advance:advanceAmount,              
              remaining: slotFees - advanceAmount 
            }
          });

     await OwnerUpdate({
             phoneNumber: turf.owner.phone,
             notification_data: {
               user: fullname,
               phone: phone,
               date: new Date(date).toDateString(),
               slotStart:start,
               slotEnd: end,
               duration: ((timeStringToMinutes(end)-timeStringToMinutes(start))/60).toFixed(1),
               sport:"sport",
               total: slotFees,             
               advance: advanceAmount,            
               remained: slotFees - advanceAmount
              
               
             }
           });     

    console.log("newManualBooking", newManualBooking)
    return res.status(200).json({ message: "Slot status updated successfully", booking: newManualBooking });
    
  } catch (error) {
    console.log("Manual booking Error", error);
    res.status(200).json({message:"Manual Booking Error"})
  }
}

const cancelBooking = async (req, res) => {
  try {
    const { bookingId, date, turfId, start ,end } = req.body;
   

    if (!bookingId || !date || !turfId) {
      return res.status(400).json({ success: false, message: "Booking ID, date, slot ID, and turf ID are required" });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }

    const day = turf.bookedSlots.find((d) => d.date === date);
    if (!day) {
      return res.status(404).json({ success: false, message: "No booked slots for this date" });
    }

    const slotIndex = day.slots.findIndex((s) => s.start === start && s.end === end);
    if (slotIndex === -1) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }
    day.slots.splice(slotIndex, 1);
    if (day.slots.length === 0) {
      turf.bookedSlots = turf.bookedSlots.filter((d) => d.date !== date);
    }
    await turf.save();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const getSubscriptions = async (req, res) =>{
  try {
    const { turfId } = req.query;
    if(!turfId){
      return res.status(400).json({ success: false, message: "Turf ID is required" });
    }
    const subscription = await Subscription.find({turfId: turfId }).populate('userId', 'fullname, email, phone') || [];
    if (!subscription) {
      return res.status(404).json({ success: false, message: "subscription not found" });
    }
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }

}

const generatePdf = async (req, res) => {
  try {
    const { turfId, month, year } = req.query;
    if (!turfId || !month || !year) {
      return res.status(400).json({ success: false, message: "Turf ID, month, and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    console.log("startDate", startDate);
    console.log("endDate", endDate);

    const bookings = await Booking.find({
      turfId: turfId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'fullname email phone');
    console.log("bookings", bookings);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bookings_${month}_${year}.pdf"`);

    doc.pipe(res);

    // Colors
    const primaryColor = '#1f2937';
    const secondaryColor = '#4b5563';
    const accentColor = '#059669';
    const lightGray = '#f3f4f6';
    const borderColor = '#d1d5db';

    // Header Section
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('MONTHLY BOOKINGS REPORT', 50, 50, { align: 'center' });

    // Report Details
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Report Period: ${new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, 50, 80)
      .text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 50, 95)
      .text(`Total Bookings: ${bookings.length}`, 400, 80)
      .text(`Total Revenue: ₹${bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0)}`, 400, 95);

    // Table Setup
    const startY = 120;
    const rowHeight = 25;
    const margin = 50;
    const pageWidth = doc.page.width - (margin * 2);

    // Table Header
    doc
      .fillColor(accentColor)
      .rect(margin, startY, pageWidth, rowHeight)
      .fill();

    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('#', margin + 5, startY + 8, { width: 25, align: 'center' })
      .text('CUSTOMER', margin + 35, startY + 8, { width: 80, align: 'left' })
      .text('DATE', margin + 125, startY + 8, { width: 70, align: 'center' })
      .text('SLOTS', margin + 205, startY + 8, { width: 90, align: 'center' })
      .text('ADVANCE', margin + 305, startY + 8, { width: 60, align: 'right' })
      .text('TOTAL', margin + 375, startY + 8, { width: 60, align: 'right' })
      .text('BALANCE', margin + 445, startY + 8, { width: 60, align: 'right' })
      .text('STATUS', margin + 515, startY + 8, { width: 50, align: 'center' });

    let currentY = startY + rowHeight;

    if (bookings.length === 0) {
      doc
        .fillColor(secondaryColor)
        .fontSize(12)
        .text('No bookings found for this period.', margin, currentY + 20, { align: 'center' });
    } else {
      // Table Rows
      bookings.forEach((booking, index) => {
        // Check for page break
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
          
          // Redraw header on new page
          doc
            .fillColor(accentColor)
            .rect(margin, currentY, pageWidth, rowHeight)
            .fill()
            .fillColor('#ffffff')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('#', margin + 5, currentY + 8, { width: 25, align: 'center' })
            .text('CUSTOMER', margin + 35, currentY + 8, { width: 80, align: 'left' })
            .text('DATE', margin + 125, currentY + 8, { width: 70, align: 'center' })
            .text('SLOTS', margin + 205, currentY + 8, { width: 90, align: 'center' })
            .text('ADVANCE', margin + 305, currentY + 8, { width: 60, align: 'right' })
            .text('TOTAL', margin + 375, currentY + 8, { width: 60, align: 'right' })
            .text('BALANCE', margin + 445, currentY + 8, { width: 60, align: 'right' })
            .text('STATUS', margin + 515, currentY + 8, { width: 50, align: 'center' });
          
          currentY += rowHeight;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc
            .fillColor(lightGray)
            .rect(margin, currentY, pageWidth, rowHeight)
            .fill();
        }

        // Reset text color
        doc.fillColor(primaryColor).font('Helvetica');

        // Row number
        doc
          .fontSize(8)
          .text((index + 1).toString(), margin + 5, currentY + 8, { width: 25, align: 'center' });

        // Customer name (using fullname from populate)
        const customerName = booking.userId?.fullname || 'Guest User';
        doc
          .text(customerName, margin + 35, currentY + 8, { width: 80, align: 'left' });

        // Date
        const bookingDate = new Date(booking.date).toLocaleDateString('en-IN');
        doc
          .text(bookingDate, margin + 125, currentY + 8, { width: 70, align: 'center' });

        // Slot timings
        const slotText = booking.slots.map(s => `${s.start}-${s.end}`).join(", ");
        doc
          .text(slotText, margin + 205, currentY + 8, { width: 90, align: 'center' });

        // Amount paid
        doc
          .text(`₹${booking.amountPaid || 0}`, margin + 305, currentY + 8, { width: 60, align: 'right' });

        // Slot fees (Total)
        doc
          .text(`₹${booking.slotFees || 0}`, margin + 375, currentY + 8, { width: 60, align: 'right' });

        // Balance amount
        const balance = (booking.slotFees || 0) - (booking.amountPaid || 0);
        doc
          .text(`₹${balance}`, margin + 445, currentY + 8, { width: 60, align: 'right' });

        // Status with color coding
        const status = booking.status || 'confirmed';
        const statusColor = status === 'confirmed' ? '#059669' : 
                           status === 'cancelled' ? '#dc2626' : 
                           '#d97706';
        
        doc
          .fillColor(statusColor)
          .text(status.charAt(0).toUpperCase() + status.slice(1), margin + 515, currentY + 8, { width: 50, align: 'center' })
          .fillColor(primaryColor);

        // Draw row border
        doc
          .strokeColor(borderColor)
          .lineWidth(0.3)
          .moveTo(margin, currentY + rowHeight)
          .lineTo(margin + pageWidth, currentY + rowHeight)
          .stroke();

        currentY += rowHeight;
      });

      // Summary Section at the end
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SUMMARY', margin, currentY + 20)
        .strokeColor(accentColor)
        .lineWidth(1)
        .moveTo(margin, currentY + 25)
        .lineTo(margin + 100, currentY + 25)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Total Bookings: ${totalBookings}`, margin, currentY + 40)
        .text(`Confirmed: ${confirmedBookings}`, margin + 120, currentY + 40)
        .text(`Cancelled: ${cancelledBookings}`, margin + 240, currentY + 40)
        .text(`Total Revenue: ₹${totalRevenue}`, margin + 360, currentY + 40);
    }

    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const updateSubscriptionSlot = async (req, res) => {
  try {
    const payload = req.body;
    const { id } = req.params;
    if(!id){
      return res.status(400).json({ success: false, message: "Subscription ID is required" });
    }
    const updatedSubscription = await Subscription.findByIdAndUpdate(id, payload, { new: true });
    if (!updatedSubscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    res.status(200).json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }

}


module.exports = {

    turfAllBookings,
    getCustomers,
    getTurfDetails,
    updateTurfProfile,
    getOwnedTurfs,
    ownerRegister,
    dashboardDetails,
    updateOwner,
    getAvailableSlots,
    addManualBooking,
    cancelBooking,
    getSubscriptions,
    generatePdf,
    updateSubscriptionSlot

};