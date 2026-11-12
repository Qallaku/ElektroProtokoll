module.exports = async (req, res) => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const priceId = process.env.STRIPE_PRICE_ID || '';
  const webhook = process.env.STRIPE_WEBHOOK_SECRET || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  res.status(200).json({
    STRIPE_SECRET_KEY: key ? { prefix: key.slice(0, 8), length: key.length } : null,
    STRIPE_PRICE_ID: priceId ? { prefix: priceId.slice(0, 8), length: priceId.length } : null,
    STRIPE_WEBHOOK_SECRET: webhook ? { prefix: webhook.slice(0, 8), length: webhook.length } : null,
    SUPABASE_URL: supabaseUrl ? { prefix: supabaseUrl.slice(0, 20), length: supabaseUrl.length } : null,
    SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? { prefix: supabaseKey.slice(0, 8), length: supabaseKey.length } : null,
  });
};
// trigger redeploy 1794476751
