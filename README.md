# The Big Day

Wedding website and planning app started by László Vágási. A couple creates one site, shares the link, and tracks guests, RSVPs, a schedule, photos, registry links, and a song list. Guests do not need an account.

The marketing page calls the product **The Big Day**.

## What works

- Marketing page with three template previews and a labeled sample website at `/weddings/sample`
- Account sign-in, including password reset
- Wedding details (title, link, date, venue, address, dress code, RSVP deadline, cover photo, template)
- Theme (template and accent color)
- Schedule, guest list, RSVP board, and invitation preview
- Photo gallery, registry links, and a playlist guests can vote on
- Planner checklist, notes, and budget, saved on the wedding in Firestore
- Guest list and RSVPs saved on the wedding in Firestore
- Public wedding page with RSVP (the invitation link is enough; no account and no code), registry, and playlist
- Stripe Checkout for the Basic, Premium, and Deluxe plans (needs the env vars below)
- Seating and venue blueprint editors

## Two ways to store data

| Mode | When | Where data lives |
| --- | --- | --- |
| `local` | Phone preview, or no Firebase project yet | This browser only (`localStorage`). A preview login is created for you. |
| `firebase` | The original project, or your own | Cloud Firestore, Firebase Auth, and Storage |

Set the mode in `.env.local`:

```bash
cp .env.example .env.local
```

`.env.example` defaults to `firebase` and project `the-big-day-31aox`. Next.js inlines `NEXT_PUBLIC_*` values when the dev server starts and when you run `npm run build`, so restart or rebuild after changing them. The Dockerfile also builds with `firebase`. `local` remains available for an offline browser-only trial.

### Preview login (local mode only)

This is not a real person and it is not created in Firebase.

- Email: `demo@example.com`
- Password: `demopassword123`

On the login screen, use **Fill preview login**. You can also register any email; it stays in this browser. **Forgot password** sets a new password here. It does not send email in local mode.

Create a wedding under **Wedding Details**, then open **View Site**. Guest links only work in the same browser that created them.

### Firebase mode

The app uses Firebase project `the-big-day-31aox`. The web config in `src/lib/firebase-config.ts` falls back to that project. Turn on **Email/Password** authentication. Deploy the rules before the public site or guest RSVPs will be rejected:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

`firestore.rules` lets anyone read a wedding document (so the public page can render) and lets a guest update only `rsvpStatus`, `mealChoice`, and `updatedAt` when they have the guest id from their invitation link. Playlist votes may update only the `songs` field. Guest lists stay private to the signed-in couple.

There is no shared demo account in Firebase mode.

## Run it

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:9002](http://localhost:9002).

```bash
npm run build
npm start
```

`npm test` currently prints that there is no automated suite. `npm run typecheck` runs TypeScript. The production build still ignores existing type and lint errors (`ignoreBuildErrors` / `ignoreDuringBuilds` in `next.config.ts`) so a large older seating editor does not block a deploy.

## Email

KaizenViz’s mail provider was not visible from this environment, so invitations and RSVP confirmations use SMTP. Resend, Postmark, and SendGrid can all do this. Set:

- `SMTP_HOST`
- `SMTP_PORT` (usually `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` or `EMAIL_FROM` (optional)
- `SMTP_SECURE=true` only for port 465

Until those are set, invitation sending returns a clear message. RSVPs are still saved. A confirmation email is sent only when SMTP is configured.

## Stripe

Checkout uses Stripe-hosted Checkout Sessions. The webhook at `/api/stripe/webhook` records the plan after `checkout.session.completed` or `checkout.session.async_payment_succeeded` when `payment_status` is paid. The success page does not grant the plan.

Create three one-time Prices in the Stripe Dashboard (test mode first) and set:

- `STRIPE_SECRET_KEY` — restricted key (`rk_test_...`), not a secret `sk_` key if you can avoid it
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — publishable key, only if a later client SDK needs it (Checkout itself is server-created)
- `STRIPE_WEBHOOK_SECRET` — signing secret for the endpoint
- `STRIPE_PRICE_BASIC` — price id for **The Big Day Basic**, 49 USD, one time
- `STRIPE_PRICE_PREMIUM` — price id for **The Big Day Premium**, 99 USD, one time
- `STRIPE_PRICE_DELUXE` — price id for **The Big Day Deluxe**, 149 USD, one time
- `FIREBASE_SERVICE_ACCOUNT_JSON` — service account JSON so the webhook can write `users/{uid}.plan` and `purchases/{sessionId}`. Without it the webhook returns 500 and Stripe retries.

Point the webhook at `https://<your-host>/api/stripe/webhook` and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.

No Stripe keys are stored in the repo.

## Deploy

The app is Next.js with server routes for invitations, RSVP mail, and Stripe. Use a host that runs the Next.js server. No custom domain: use the free Firebase address.

App Hosting region: **europe-west4 (Netherlands)**. That is the Europe region App Hosting supports. Create it with:

```bash
firebase apphosting:backends:create --project the-big-day-31aox --location europe-west4
```

The free URL looks like `https://<backend-id>--the-big-day-31aox.europe-west4.hosted.app`.

Firestore’s location is fixed when the database is first created and cannot be moved. If `the-big-day-31aox` does not have a database yet, create it in **europe-west1 (Belgium)**. The Hosting frameworks backend in `firebase.json` is also `europe-west1`, because that is the Cloud Functions region paired with this project. App Hosting itself stays `europe-west4`.

### Docker

```bash
docker build -t the-big-day .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_DATA_MODE=firebase \
  -e SMTP_HOST -e SMTP_PORT -e SMTP_USER -e SMTP_PASS \
  the-big-day
```

`NEXT_PUBLIC_*` is read at **build** time. Pass `--build-arg NEXT_PUBLIC_DATA_MODE=firebase` and your Firebase args when you build the image. The Dockerfile defaults that mode to `firebase`.

### Firebase

1. `npm install -g firebase-tools` (or use `npx firebase-tools`)
2. `firebase login` and `firebase use the-big-day-31aox`. `.firebaserc` already names that project.
3. Deploy rules: `firebase deploy --only firestore:rules,storage`
4. For the Next.js app, use **Firebase App Hosting** (`apphosting.yaml`) or web frameworks with `firebase.json` hosting `source: "."`.

App Hosting needs a billing account. Set `NEXT_PUBLIC_DATA_MODE=firebase` and the Firebase web config as build environment variables, then connect the GitHub repo in the Firebase console.

Firebase Hosting alone, without the frameworks backend or App Hosting, cannot run the invitation API.

### Netlify

`netlify.toml` sets the Next.js build. In the Netlify UI, set `NEXT_PUBLIC_DATA_MODE=firebase` and the Firebase web keys, then deploy the repository. The Next.js runtime plugin serves the server route.

### Static export

Do not use `output: 'export'`. The invitation route and server-rendered public pages need a server. Local mode is only for a browser preview.

## Decisions already made

- `/weddings/sample` stays, with the placeholder couple, date, and venue. It does not save RSVPs.
- Firebase project is `the-big-day-31aox`.
- An invitation link is enough to RSVP. Guests do not sign in and do not enter a code.
- Plans are sold with Stripe Checkout. Keys stay in the environment.
- Mail is SMTP until the KaizenViz provider is confirmed.
- Hosting is the free Firebase address, App Hosting in `europe-west4`.
- Planner checklist, budget, and the guest list are stored on the wedding in Firestore.
- The contact email has been removed from the site.

## Still open

- **Sample quotes** on the homepage are not real reviews.
- **Draw venue shape** on the seating canvas is still labeled as not available.
- **Genkit** (`src/ai`) is not connected to any screen.
- **Playlist votes** can be changed by anyone who can open the site, because the rule allows updates that touch only `songs`.
- Stripe products, price ids, the webhook secret, and `FIREBASE_SERVICE_ACCOUNT_JSON` still have to be created in the dashboards. Nothing is deployed yet.
