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
        '1': data.status,              // Booking status: confirmed / cancelled
        '2': data.name,                // Owner's first name
        '3': data.turfName,            // Turf name
        '4': data.date,                // Booking date
        '5': data.time,                // Booking time
        '6': data.sport,               // Sport name
        '7': data.user,                // User full name
        '8': data.advance,             // Advance amount
        '9': data.remained         // Remaining amount
      })
    });

    console.log("✅ WhatsApp message sent to owner:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp message failed:", error.message);
  }
};



module.exports = {sendMessage, OwnerUpdate} ;
