const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Raw body is required to verify the Stripe signature.
module.exports.config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || (session.metadata && session.metadata.userId);
        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            stripe_customer_id: session.customer,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase
          .from('profiles')
          .update({ subscription_status: sub.status, updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', sub.customer);
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe-webhook handler error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
};
