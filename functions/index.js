const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {logger} = require("firebase-functions");
const axios = require("axios");

exports.sendConfirmationEmailV2 = onDocumentCreated(
    "waitlist/{docId}",
    async (event) => {
      const data = event.data && event.data.data();

      if (!data || !data.email) {
        logger.log("⚠️ No email found in new document.");
        return;
      }

      const email = data.email;
      const brevoApiKey = process.env.BREVO_API_KEY;

      try {
        await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
              sender: {
                name: "BeyondDEX",
                email: "team@beyonddex.com",
              },
              to: [{email}],
              subject: "You're on the BeyondDEX waitlist 🚀",
              htmlContent:
            "<p>Thanks for joining the BeyondDEX waitlist!</p>" +
            "<p>We're building something exciting. Stay tuned.</p>",
            },
            {
              headers: {
                "api-key": brevoApiKey,
                "Content-Type": "application/json",
              },
            },
        );

        logger.log(`✅ Confirmation sent to ${email}`);
      } catch (error) {
        logger.error("❌ Failed to send confirmation email:", error.message);
      }
    },
);
