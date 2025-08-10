// functions/index.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const axios = require('axios');

exports.sendConfirmationEmailV2 = onDocumentCreated(
  { document: 'waitlist/{docId}', region: 'us-central1' },
  async (event) => {
    const data = event.data && event.data.data();
    if (!data || !data.email) {
      logger.warn('No email found in new document.', { dataPresent: !!data });
      return;
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      logger.error('BREVO_API_KEY is missing from process.env');
      return;
    }

    const email = String(data.email).trim();

    try {
      const resp = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'BeyondDEX', email: 'team@beyonddex.com' },
          to: [{ email }],
          subject: 'You\'re on the BeyondDEX waitlist 🚀',
          htmlContent:
            '<p>Thanks for joining the BeyondDEX waitlist!</p>' +
            '<p>We\'re building something exciting. Stay tuned.</p>'
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      logger.info('Email sent', { to: email, status: resp.status });
    } catch (error) {
      const status = error && error.response ? error.response.status : undefined;
      const dataOut = error && error.response ? error.response.data : undefined;
      logger.error('Failed to send confirmation email', {
        to: email,
        message: error && error.message ? error.message : String(error),
        status,
        data: dataOut
      });
    }
  }
);