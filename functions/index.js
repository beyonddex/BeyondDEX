const functions = require("firebase-functions");
const axios = require("axios");
require("dotenv").config();

exports.sendConfirmationEmail = functions.firestore
  .document("waitlist/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const email = data.email;

    if (!email) {
      console.log("No email found");
      return null;
    }

    const brevoApiKey = process.env.BREVO_API_KEY;

    try {
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "BeyondDEX", email: "team@beyonddex.com" },
          to: [{ email }],
          templateId: 1, // ⬅️ Replace with your actual Brevo template ID
          params: {
            // name: data.name || "Trader" — Optional dynamic variables
          }
        },
        {
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`✅ Confirmation email sent to ${email}`);
    } catch (error) {
      console.error("❌ Error sending email:", error.message);
    }

    return null;
  });
