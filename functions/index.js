const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const {logger} = require('firebase-functions');
const axios = require('axios');

// Secret Manager: set with `firebase functions:secrets:set BREVO_API_KEY`
const BREVO_API_KEY = defineSecret('BREVO_API_KEY');

// Hard-coded Brevo template ID
const TEMPLATE_ID = 1;

exports.sendWaitlistEmailOnCreate = onDocumentCreated(
  {document: 'waitlist/{docId}', region: 'us-central1', secrets: [BREVO_API_KEY]},
  async (event) => {
    const data = event.data && event.data.data();
    if (!data || !data.email) {
      logger.warn('No email field on new waitlist doc');
      return;
    }

    const apiKey = BREVO_API_KEY.value();
    if (!apiKey) {
      logger.error('BREVO_API_KEY secret is not available at runtime');
      return;
    }

    const email = String(data.email).trim();
    const name = (data.firstName || data.name || '').toString().trim();

    const payload = {
      sender: {name: 'BeyondDEX', email: 'team@beyonddex.com'},
      to: [{email, name: name || undefined}],
      templateId: TEMPLATE_ID, // <-- always use your Brevo template #1
      params: {
        firstName: name || '',
        waitlistId: (event.params && event.params.docId) || '',
        product: 'BeyondDEX'
      },
      tags: ['waitlist', 'beyonddex']
      // Note: don't include subject/htmlContent when using templateId
    };

    try {
      const resp = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {headers: {'api-key': apiKey, 'Content-Type': 'application/json'}, timeout: 10000}
      );
      logger.info('Brevo response', {status: resp.status});
    } catch (error) {
      logger.error('Brevo error', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message || String(error)
      });
    }
  }
);