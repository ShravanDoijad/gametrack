const twilio = require("twilio");
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const value = (input, fallback = "Not provided") => {
  if (input === undefined || input === null || String(input).trim() === "") return String(fallback);
  return String(input).trim();
};

const whatsappAddress = (input) => {
  let phone = String(input || "").trim().replace(/^whatsapp:/i, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  const hasCountryPrefix = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) throw new Error("Enter a valid WhatsApp phone number.");
  if (hasCountryPrefix) phone = `+${digits}`;
  else if (digits.length === 10) phone = `+91${digits}`;
  else phone = `+${digits}`;
  return `whatsapp:${phone}`;
};

const sendWhatsAppTemplate = async ({ phoneNumber, contentSid, templateName, variables }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio account credentials are not configured.");
  }
  if (!contentSid) throw new Error(`${templateName} is not configured.`);
  const from = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER is not configured.");
  return client.messages.create({
    from: whatsappAddress(from),
    to: whatsappAddress(phoneNumber),
    contentSid,
    contentVariables: JSON.stringify(variables),
  });
};

const getTimeRange = (data) => {
  const range = String(data.time || "").split(/\s*-\s*/);
  return {
    start: data.startTime || data.slotStart || range[0],
    end: data.endTime || data.slotEnd || range[1],
  };
};

const sendMessage = async ({ phoneNumber, data, notification_data }) => {
  const details = data || notification_data || {};
  const time = getTimeRange(details);
  const variables = {
    1: value(details.customerName || details.name || details.fullname || details.user),
    2: value(details.turfName),
    3: value(details.date),
    4: value(time.start),
    5: value(time.end),
    6: value(details.bookingReference || details.bookingId || details.reference, "Booking"),
    7: value(details.totalAmount ?? details.amount ?? details.total ?? details.slotFees, "0"),
    8: value(details.advancePaid ?? details.advance ?? details.amountPaid, "0"),
    9: value(details.remainingAmount ?? details.remaining ?? details.remained ?? details.due, "0"),
    10: value(details.contactPhone || details.phone || phoneNumber),
    11: value(details.website || details.dashboardUrl, "https://gametrack.in"),
  };
  try {
    const response = await sendWhatsAppTemplate({
      phoneNumber,
      contentSid: process.env.TWILIO_BOOKING_SID,
      templateName: "TWILIO_BOOKING_SID",
      variables,
    });
    console.log("WhatsApp booking template sent:", response.sid);
    return response;
  } catch (error) {
    console.error("WhatsApp booking template failed:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      templateConfigured: Boolean(process.env.TWILIO_BOOKING_SID),
      senderConfigured: Boolean(process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER),
    });
    return null;
  }
};

const OwnerUpdate = async ({ phoneNumber, notification_data, data }) => {
  const details = notification_data || data || {};
  const time = getTimeRange(details);
  const variables = {
    1: value(details.customerName || details.user || details.name),
    2: value(details.mobile || details.customerPhone || details.phone),
    3: value(details.date),
    4: value(time.start),
    5: value(time.end),
    6: value(details.duration),
    7: value(details.bookingReference || details.bookingId || details.reference, "Booking"),
    8: value(details.totalAmount ?? details.total ?? details.amount, "0"),
    9: value(details.advancePaid ?? details.advance ?? details.amountPaid, "0"),
    10: value(details.remainingAmount ?? details.remaining ?? details.remained ?? details.due, "0"),
    11: value(details.dashboardUrl, "https://gametrack.in/owner/dashboard"),
  };
  try {
    const response = await sendWhatsAppTemplate({
      phoneNumber,
      contentSid: process.env.TWILIO_OWNER_CONTENT_SID,
      templateName: "TWILIO_OWNER_CONTENT_SID",
      variables,
    });
    console.log("WhatsApp owner notification sent:", response.sid);
    return response;
  } catch (error) {
    console.error("WhatsApp owner notification failed:", error.message);
    return null;
  }
};

const UserSubscriptionUpdate = async ({ phoneNumber, notification_data, data }) => {
  const details = notification_data || data || {};
  const variables = {
    1: value(details.name || details.customerName),
    2: value(details.turfName),
    3: value(details.fromDate),
    4: value(details.toDate),
    5: value(details.totalDays),
    6: value(details.slotStart || details.startTime),
    7: value(details.slotEnd || details.endTime),
    8: value(details.duration),
    9: value(details.sport),
    10: value(details.totalAmount ?? details.total, "0"),
    11: value(details.advancePaid ?? details.advance, "0"),
    12: value(details.remainingAmount ?? details.remaining ?? details.remained, "0"),
  };
  try {
    const response = await sendWhatsAppTemplate({
      phoneNumber,
      contentSid: process.env.TWILIO_USER_SUBSCRIPTION,
      templateName: "TWILIO_USER_SUBSCRIPTION",
      variables,
    });
    console.log("WhatsApp subscription notification sent to user:", response.sid);
    return response;
  } catch (error) {
    console.error("WhatsApp subscription notification to user failed:", error.message);
    return null;
  }
};

const OwnerSubscriptionUpdate = async ({ phoneNumber, notification_data, data }) => {
  const details = notification_data || data || {};
  const variables = {
    1: value(details.customerName || details.user || details.name),
    2: value(details.userPhone || details.mobile || details.phone),
    3: value(details.fromDate),
    4: value(details.toDate),
    5: value(details.totalDays),
    6: value(details.slotStart || details.startTime),
    7: value(details.slotEnd || details.endTime),
    8: value(details.duration),
    9: value(details.totalAmount ?? details.total, "0"),
    10: value(details.advancePaid ?? details.advance, "0"),
    11: value(details.remainingAmount ?? details.remaining ?? details.remained, "0"),
  };
  try {
    const response = await sendWhatsAppTemplate({
      phoneNumber,
      contentSid: process.env.TWILIO_OWNER_SUBSCRIPTION,
      templateName: "TWILIO_OWNER_SUBSCRIPTION",
      variables,
    });
    console.log("WhatsApp subscription notification sent to owner:", response.sid);
    return response;
  } catch (error) {
    console.error("WhatsApp subscription notification to owner failed:", error.message);
    return null;
  }
};

module.exports = {
  sendMessage,
  OwnerUpdate,
  UserSubscriptionUpdate,
  OwnerSubscriptionUpdate,
  sendWhatsAppTemplate,
  whatsappAddress,
};
