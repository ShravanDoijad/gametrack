const crypto = require('crypto');
const Booking = require('../models/booking-model');
const Turf = require('../models/turf-model');
const User = require('../models/user-model');
const { sendMessage, OwnerUpdate } = require('../twilio/sendMessage');
const Notification = require('../models/notification-model');

const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;

    if (event === 'payment_link.paid') {
      const paymentLink = req.body.payload.payment_link.entity;
      const bookingId = paymentLink.reference_id; // we passed booking._id as reference_id

      if (!bookingId) {
         return res.status(200).json({ status: 'ignored, no reference_id' });
      }

      const booking = await Booking.findById(bookingId).populate('turfId').populate('userId');

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status === 'confirmed') {
        return res.status(200).json({ status: 'already confirmed' });
      }

      // 1. Update Booking
      booking.status = 'confirmed';
      booking.amountPaid = paymentLink.amount_paid / 100;
      // Get the payment ID from the payment link payload if available
      booking.razorpay_payment_id = paymentLink.payment_id || 'via_payment_link';
      await booking.save();

      const user = booking.userId;
      const turf = booking.turfId;
      const slot = booking.slots[0];
      const slotTimeText = `${slot.start} - ${slot.end}`;

      // 2. Send WhatsApp Notification to User (Using existing template in sendMessage.js)
      try {
        await sendMessage({
          phoneNumber: user.phone,
          notification_data: {
            name: user.fullname.split(" ")[0],
            turfName: turf.name,
            date: new Date(booking.date).toDateString(),
            time: slotTimeText,
            location: turf.location.city,
            amount: booking.slotFees,
            sport: booking.sport || "Football",
            advance: booking.amountPaid,
            remaining: booking.slotFees - booking.amountPaid
          }
        });
      } catch (err) {
        console.error("Failed to send WhatsApp to User:", err);
      }

      // 3. Create Notifications in DB
      await Notification.create({
        user: user._id,
        owner: turf.owner,
        title: "Booking Confirmed",
        message: `Your booking on ${booking.date} at ${slotTimeText} is confirmed at ${turf.name}`,
        type: "booking",
        role: "user",
        date: new Date(),
      });

      await Notification.create({
        user: user._id,
        owner: turf.owner,
        title: "New WhatsApp Booking",
        message: `New WhatsApp booking on ${booking.date} at ${slotTimeText} at ${turf.name}`,
        type: "booking",
        role: "owner",
        date: new Date(),
      });

    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  razorpayWebhook
};
