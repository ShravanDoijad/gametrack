const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sendMessage = async ({ phoneNumber, notification_data }) => {
  const data = notification_data;


  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_BOOKING_SID, // must match your approved template SID
      contentVariables: JSON.stringify({
        1: String(data.name),
        2: String(data.turfName),
        3: String(data.date),
        4: String(data.time),
        5: String(data.location),
        6: String(data.amount),
        7: String(data.sport),
        8: String(data.advance),
        9: String(data.remaining),
      })
    });

    console.log("✅ WhatsApp message sent:", response.sid);
  } catch (error) {

    console.error("❌ WhatsApp message failed:", error.message);
  }
};

const OwnerUpdate = async ({ phoneNumber, notification_data }) => {
  const data = notification_data;

  try {
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+91${phoneNumber}`,
      contentSid: process.env.TWILIO_OWNER_CONTENT_SID,
      contentVariables: JSON.stringify({
        1: String(data.user),
        2: String(data.phone),
        3: String(data.date),
        4: String(data.slotStart),
        5: String(data.slotEnd),
        6: String(data.duration),
        7: String(data.sport),
        8: String(data.total),
        9: String(data.advance),
        10: String(data.remained)
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
        '1': String(data.name),          // Hi {{1}},
        '2': String(data.turfName),      // at {{2}} is confirmed.
        '3': String(data.fromDate),      // From: {{3}}
        '4': String(data.toDate),        // to {{4}}
        '5': String(data.totalDays),     // Total Days: {{5}}
        '6': String(data.slotStart),     // Slot: {{6}}
        '7': String(data.slotEnd),       // - {{7}}
        '8': String(data.duration),      // ({{8}} hrs)
        '9': String(data.sport),         // Sport: {{9}}
        '10':String( data.total),        // Total ₹{{10}}
        '11':String( data.advance),      // Paid ₹{{11}}
        '12':String( data.remaining)     // Due ₹{{12}}
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
        '1': String(data.user),          //  Name: {{1}}
        '2': String(data.userPhone),     //  Mobile: {{2}}
        '3': String(data.fromDate),      // From: {{3}}
        '4': String(data.toDate),        // to {{4}}
        '5': String(data.totalDays),     // Total Days: {{5}}
        '6': String(data.slotStart),     // Slot: {{6}}
        '7': String(data.slotEnd),       // - {{7}}
        '8': String(data.duration),      // ({{8}} hrs)
        '9': String(data.total),         //  Total: ₹{{9}}
        '10':String( data.advance),      //  Advance: ₹{{10}}
        '11':String( data.remaining)     //  Remained: ₹{{11}}
      })
    });

    console.log("✅ WhatsApp subscription message sent to owner:", response.sid);
  } catch (error) {
    console.error("❌ WhatsApp subscription message to owner failed:", error.message);
  }
};





module.exports = { sendMessage, OwnerUpdate, UserSubscriptionUpdate, OwnerSubscriptionUpdate };
