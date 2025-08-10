const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const {logger} = require('firebase-functions');
const axios = require('axios');

const BREVO_API_KEY = defineSecret('BREVO_API_KEY');

exports.sendWaitlistEmailOnCreate = onDocumentCreated(
  { document: 'waitlist/{docId}', region: 'us-central1', secrets: [BREVO_API_KEY] },
  async (event) => {
    const data = event.data && event.data.data();
    if (!data || !data.email) { logger.warn('No email field on new waitlist doc'); return; }

    const apiKey = BREVO_API_KEY.value();
    logger.info('Env check', { hasApiKey: !!apiKey });

    try {
      const resp = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'BeyondDEX', email: 'team@beyonddex.com' },
          to: [{ email: String(data.email).trim() }],
          subject: 'You\'re on the BeyondDEX waitlist 🚀',
          htmlContent:
            '<p>Thanks for joining the BeyondDEX waitlist!</p>' +
            '<p>We\'re building something exciting. Stay tuned.</p>'
        },
        { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      logger.info('Brevo response', { status: resp.status });
    } catch (e) {
      logger.error('Brevo error', { status: e?.response?.status, data: e?.response?.data, message: e?.message });
    }
  }
);
