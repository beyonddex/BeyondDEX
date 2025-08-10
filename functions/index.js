const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {logger} = require('firebase-functions');
const axios = require('axios');

exports.sendWaitlistEmailOnCreate = onDocumentCreated(
  { document: 'waitlist/{docId}', region: 'us-central1' },
  async (event) => {
    const data = event.data && event.data.data();
    logger.info('Trigger fired', { hasData: !!data, keys: data ? Object.keys(data) : [] });

    if (!data || !data.email) {
      logger.warn('No email field on new waitlist doc');
      return;
    }

    const apiKey = process.env.BREVO_API_KEY;
    logger.info('Env check', { hasApiKey: !!apiKey });

    if (!apiKey) {
      logger.error('Missing BREVO_API_KEY in process.env');
      return;
    }

    const email = String(data.email).trim();
    logger.info('Sending email via Brevo', { to: email });

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
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      logger.info('Brevo response', { status: resp.status });
    } catch (error) {
      const status = error && error.response ? error.response.status : undefined;
      const dataOut = error && error.response ? error.response.data : undefined;
      logger.error('Brevo error', {
        status, data: dataOut, message: error && error.message ? error.message : String(error)
      });
    }
  }
);
