-- Rename Stripe-specific columns to Mercado Pago equivalents
ALTER TABLE users RENAME COLUMN stripe_customer_id TO mp_payer_id;
ALTER TABLE users RENAME COLUMN stripe_subscription_id TO mp_subscription_id;
