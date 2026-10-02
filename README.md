# Naija Pantry

Nigerian groceries shop. Next.js + Firebase Auth (Google) + Supabase (orders) + Mailgun (confirmation email).

## Setup
1. Supabase: SQL Editor, paste and run `sql/schema.sql`.
2. Deploy: push to GitHub, import the repo in Vercel.
3. In Vercel, Environment Variables, add every name in `.env.example` with your values.
4. Firebase Console: Authentication, Settings, Authorized domains, add your `*.vercel.app` domain.
5. Mailgun sandbox domains only send to authorized recipients. Add your test email in Mailgun first.
6. Redeploy, then test: sign in, order, check the email, log out, sign in again, check My orders.

Never commit `.env` files or keys. Prices are enforced on the server in `lib/products.js`.
