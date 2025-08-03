const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

 const sendMessage = async ({ phoneNumber, notification_data }) => {
  const data = await notification_data;
  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_BOOKING_SID, // must match your approved template SID
      contentVariables: JSON.stringify({
        '1': data.name,               
        '2': data.turfName,          
        '3': data.date,               
        '4': data.time,  
        '5': data.location,           
        '6': data.totalAmount,
        '7': data.sport,              
        '8': data.advanceAmount,    
        '9': data.remainingAmount   
      })
    });

    console.log("✅ WhatsApp message sent:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp message failed:", error.message);
  }
};

const OwnerUpdate = async ({ phoneNumber, notification_data }) => {
  const data = await notification_data;
  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_OWNER_CONTENT_SID,
      contentVariables: JSON.stringify({
        '1': data.user,            // User full name
        '2': data.phone,           // User phone
        '3': data.date,            // Booking date
        '4': data.slotStart,       // Slot start time
        '5': data.slotEnd,         // Slot end time
        '6': data.duration,        // Duration in hours or mins
        '7': data.sport,           // Sport
        '8': data.total,           // Total amount
        '9': data.advance,         // Advance paid
        '10': data.remained        // Remaining
      })
    });

    console.log("✅ WhatsApp message sent to owner:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp message failed:", error.message);
  }
};


const UserSubscriptionUpdate = async ({ phoneNumber, notification_data }) => {
  const data = await notification_data;
  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_USER_SUBSCRIPTION, // Must match template SID
      contentVariables: JSON.stringify({
        '1': data.name,          // Hi {{1}},
        '2': data.turfName,      // at {{2}} is confirmed.
        '3': data.fromDate,      // From: {{3}}
        '4': data.toDate,        // to {{4}}
        '5': data.totalDays,     // Total Days: {{5}}
        '6': data.slotStart,     // Slot: {{6}}
        '7': data.slotEnd,       // - {{7}}
        '8': data.duration,      // ({{8}} hrs)
        '9': data.sport,         // Sport: {{9}}
        '10': data.total,        // Total ₹{{10}}
        '11': data.advance,      // Paid ₹{{11}}
        '12': data.remaining     // Due ₹{{12}}
      })
    });

    console.log("✅ WhatsApp subscription message sent to user:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp subscription message to user failed:", error.message);
  }
};


const OwnerSubscriptionUpdate = async ({ phoneNumber, notification_data }) => {
  const data = await notification_data;
  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_OWNER_SUBSCRIPTION, // Must match template SID
      contentVariables: JSON.stringify({
        '1': data.user,          // 👤 Name: {{1}}
        '2': data.userPhone,     // 📱 Mobile: {{2}}
        '3': data.fromDate,      // From: {{3}}
        '4': data.toDate,        // to {{4}}
        '5': data.totalDays,     // Total Days: {{5}}
        '6': data.slotStart,     // Slot: {{6}}
        '7': data.slotEnd,       // - {{7}}
        '8': data.duration,      // ({{8}} hrs)
        '9': data.total,         // 💰 Total: ₹{{9}}
        '10': data.advance,      // 💸 Advance: ₹{{10}}
        '11': data.remaining     // 🧾 Remained: ₹{{11}}
      })
    });

    console.log("✅ WhatsApp subscription message sent to owner:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp subscription message to owner failed:", error.message);
  }
};





module.exports = {sendMessage, OwnerUpdate, UserSubscriptionUpdate, OwnerSubscriptionUpdate} ;
