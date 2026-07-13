# Home Design AI

Production-oriented MVP for AI floor plans and home-design concept images. Built with Next.js App Router, Tailwind CSS, Supabase, Stripe, and KIE Nano Banana models.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in the provider credentials.
3. Create a Supabase project and apply `supabase/migrations/202607100001_initial.sql`.
4. In Supabase Auth, enable Google OAuth and add `http://localhost:3000/auth/callback` plus the production callback URL.
5. Create the Stripe prices named in `.env.example`, then point a Stripe webhook at `/api/webhooks/stripe` for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Point KIE callbacks at `/api/webhooks/kie`. `NEXT_PUBLIC_APP_URL` must be publicly reachable for callback testing (a Vercel Preview or ngrok URL works).
7. Run `pnpm dev`.

## Provider behavior

- Basic: `nano-banana-2-lite`, 1 site credit.
- Pro: `nano-banana-2`, fixed 2K, 3 site credits.
- The browser uploads input images directly to a short-lived Supabase signed upload URL, avoiding Vercel request-size limits. Inputs and final results live in the private `private-assets` bucket.
- KIE callbacks are verified and treated as signals. Final state is confirmed with `recordInfo`.
- Vercel Cron reconciles non-terminal jobs every five minutes. A job still pending after 60 minutes is refunded idempotently and remains eligible for late result recovery.

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Live KIE, Supabase, Google OAuth, and Stripe tests require the corresponding environment variables and provider-side webhook configuration.

To deliberately run four paid KIE smoke cases (Basic/Pro × text/image), set `RUN_LIVE_KIE=1`, `KIE_TEST_CALLBACK_URL`, and `KIE_TEST_IMAGE_URL`, then run `pnpm test:kie-live`.
