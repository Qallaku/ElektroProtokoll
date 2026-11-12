const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId, email } = req.body || {};
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: 'Server is missing Stripe configuration' });
    }

    const origin = req.headers.origin || process.env.PUBLIC_URL || 'https://elektroprotokoll-9zkd.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
        trial_period_days: 1,
      },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
};
