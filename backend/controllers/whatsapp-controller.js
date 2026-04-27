const { MessagingResponse } = require('twilio').twiml;
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cron = require('node-cron');
const WhatsAppSession = require('../models/whatsapp-session-model');
const Turf = require('../models/turf-model');
const Booking = require('../models/booking-model');
const User = require('../models/user-model');
const Payment = require('../models/payment-model');
const { sendMessage } = require('../twilio/sendMessage');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Helper to generate slots
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
    });
  }
  return slots;
}

const handleIncomingMessage = async (req, res) => {
  const twiml = new MessagingResponse();
  try {
    console.log("message", req.body);
    const { From, Body } = req.body;
    const messageText = Body.trim();

    let session = await WhatsAppSession.findOne({ phone: From });
    if (!session || messageText.toLowerCase() === 'hi' || messageText.toLowerCase() === 'hello') {
      if (!session) {
        session = new WhatsAppSession({ phone: From, step: 'IDLE', data: {} });
      } else {
        session.step = 'IDLE';
        session.data = {};
      }
    }

    switch (session.step) {
      case 'IDLE': {
        const turfs = await Turf.find({ isActive: true }).select('name location dayPrice nightPrice');
        if (turfs.length === 0) {
          twiml.message("Sorry, no turfs are currently available.");
          break;
        }
        session.data.turfs = turfs.map(t => ({ id: t._id, name: t.name, price: t.dayPrice }));
        session.step = 'SELECT_TURF';
        
        let msg = "Welcome to GameTrack! 🏟️\nPlease reply with the number of the Turf you want to book:\n\n";
        turfs.forEach((t, i) => {
          msg += `${i + 1}. ${t.name} (📍 ${t.location?.city || 'Unknown'})\n`;
        });
        twiml.message(msg);
        break;
      }

      case 'SELECT_TURF': {
        const selection = parseInt(messageText);
        const turfs = session.data.turfs;
        
        if (isNaN(selection) || selection < 1 || selection > turfs.length) {
          twiml.message("Invalid selection. Please reply with a valid number from the list.");
          break;
        }

        const selectedTurf = turfs[selection - 1];
        session.data.turfId = selectedTurf.id;
        session.data.turfName = selectedTurf.name;
        session.data.price = selectedTurf.price;
        session.step = 'SELECT_DATE';
        
        twiml.message(`You selected *${selectedTurf.name}*.\n\nPlease enter the date you want to play.\nFormat: YYYY-MM-DD (e.g. 2026-05-01) or type 'today' or 'tomorrow'.`);
        break;
      }

      case 'SELECT_DATE': {
        let selectedDate = messageText.toLowerCase();
        let dateObj;
        
        if (selectedDate === 'today') {
          dateObj = new Date();
        } else if (selectedDate === 'tomorrow') {
          dateObj = new Date();
          dateObj.setDate(dateObj.getDate() + 1);
        } else {
          dateObj = new Date(selectedDate);
        }

        if (isNaN(dateObj.getTime())) {
          twiml.message("Invalid date format. Please use YYYY-MM-DD (e.g. 2026-05-01).");
          break;
        }

        const formattedDate = dateObj.toISOString().split('T')[0];
        const turf = await Turf.findById(session.data.turfId);
        
        const allSlots = generateSlots(turf.openingTime || "06:00", turf.closingTime || "22:00");
        
        // Filter booked slots
        const bookedDay = turf.bookedSlots.find(d => d.date === formattedDate);
        const bookedIntervals = bookedDay ? bookedDay.slots : [];
        
        const availableSlots = allSlots.filter(slot => {
          return !bookedIntervals.some(booked => booked.start === slot.start && booked.end === slot.end);
        });

        if (availableSlots.length === 0) {
          twiml.message(`Sorry, no slots available on ${formattedDate}. Please try another date (YYYY-MM-DD).`);
          break;
        }

        session.data.date = formattedDate;
        session.data.availableSlots = availableSlots;
        session.step = 'SELECT_SLOT';

        let msg = `Available slots for *${formattedDate}*:\n\n`;
        availableSlots.forEach((slot, i) => {
          msg += `${i + 1}. ${slot.start} - ${slot.end}\n`;
        });
        msg += `\nReply with the slot number.`;
        twiml.message(msg);
        break;
      }

      case 'SELECT_SLOT': {
        const selection = parseInt(messageText);
        const availableSlots = session.data.availableSlots;
        
        if (isNaN(selection) || selection < 1 || selection > availableSlots.length) {
          twiml.message("Invalid selection. Please reply with a valid number from the list.");
          break;
        }

        const selectedSlot = availableSlots[selection - 1];
        session.data.slot = selectedSlot;
        session.step = 'PLAYERS_COUNT';

        twiml.message(`You selected *${selectedSlot.start} - ${selectedSlot.end}*.\n\nHow many players will be joining? (Enter a number)`);
        break;
      }

      case 'PLAYERS_COUNT': {
        const players = parseInt(messageText);
        if (isNaN(players) || players < 1) {
          twiml.message("Please enter a valid number of players.");
          break;
        }

        session.data.playersCount = players;
        session.step = 'PAYMENT';

        // Find or create user
        let phoneNum = From.replace('whatsapp:', '').replace('+91', '');
        if (phoneNum.length > 10 && phoneNum.startsWith('+')) {
            phoneNum = phoneNum.substring(phoneNum.length - 10);
        }
        let user = await User.findOne({ phone: phoneNum });
        if (!user) {
          user = await User.create({ fullname: "WhatsApp User", phone: phoneNum, isVerified: true });
        }

        const turfId = session.data.turfId;
        const date = session.data.date;
        const slot = session.data.slot;
        const slotFees = session.data.price; // Simplified. Logic can be updated for night price.

        // Create Pending Booking
        const pendingBooking = await Booking.create({
          turfId: turfId,
          userId: user._id,
          date: new Date(date),
          slots: [slot],
          sport: "Football", // default
          slotFees: slotFees,
          originalPrice: slotFees,
          finalPrice: slotFees,
          amountPaid: 0,
          paymentType: "Online",
          status: "pending",
        });

        // Lock slot in Turf
        await Turf.updateOne(
          { _id: turfId },
          {
            $push: {
              bookedSlots: {
                date: date,
                slots: [slot],
                status: "booked"
              }
            }
          }
        );

        // Generate Razorpay Payment Link
        const paymentLinkRequest = {
          amount: slotFees * 100,
          currency: "INR",
          accept_partial: false,
          description: `Booking for ${session.data.turfName} on ${date}`,
          customer: {
            name: user.fullname,
            contact: `+91${user.phone}`
          },
          notify: { sms: false, email: false },
          reminder_enable: false,
          reference_id: pendingBooking._id.toString(), // critical to link back!
        };

        let shortUrl = "";
        try {
          const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
          shortUrl = paymentLink.short_url;

          // Create Payment record for consistency with existing system
          await Payment.create({
            userId: user._id,
            orderId: paymentLink.id, // Using payment link ID as orderId
            amount: slotFees * 100,
            status: "created",
            booking: {
              turfId: turfId,
              date: date,
              slots: [slot]
            }
          });
          
        } catch (err) {
          console.error("Razorpay Link Error:", err);
          twiml.message("Failed to generate payment link. Please try again later by typing 'HI'.");
          session.step = 'IDLE';
          break;
        }

        // Schedule auto-release after 5 minutes
        setTimeout(async () => {
          const checkBooking = await Booking.findById(pendingBooking._id);
          if (checkBooking && checkBooking.status === 'pending') {
            await Booking.findByIdAndDelete(pendingBooking._id);
            // Remove the slot
            await Turf.updateOne(
              { _id: turfId, "bookedSlots.date": date },
              { $pull: { "bookedSlots.$.slots": { start: slot.start, end: slot.end } } }
            );
            
            // Send expiration message via Twilio SDK
            const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            client.messages.create({
              from: process.env.TWILIO_PHONE_NUMBER.includes('whatsapp') ? process.env.TWILIO_PHONE_NUMBER : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
              to: From,
              body: `⏳ Your payment window has expired and the slot ${slot.start}-${slot.end} at ${session.data.turfName} has been released. Reply 'HI' to start a new booking.`
            }).catch(e => console.error("Error sending expiration:", e));
          }
        }, 5 * 60 * 1000); // 5 minutes

        let msg = `*Booking Summary* 🧾\n\n`;
        msg += `🏟️ Turf: ${session.data.turfName}\n`;
        msg += `📅 Date: ${date}\n`;
        msg += `⏰ Slot: ${slot.start} - ${slot.end}\n`;
        msg += `👥 Players: ${players}\n`;
        msg += `💰 Total: ₹${slotFees}\n\n`;
        msg += `Please complete your payment to confirm your booking:\n${shortUrl}\n\n`;
        msg += `_Note: This slot is locked for 5 minutes. If unpaid, it will be automatically released._`;

        twiml.message(msg);
        break;
      }

      case 'PAYMENT': {
        twiml.message("You have a pending payment. Please click the Razorpay link sent previously to confirm your booking. If you wish to start over, reply 'HI'.");
        break;
      }

      default:
        session.step = 'IDLE';
        twiml.message("I didn't understand that. Reply 'HI' to start booking.");
        break;
    }

    await session.save();
    res.type('text/xml').send(twiml.toString());

  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    twiml.message("Sorry, an error occurred. Please try again later.");
    res.type('text/xml').send(twiml.toString());
  }
};

module.exports = {
  handleIncomingMessage
};
