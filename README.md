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
- Planner checklist (saved in the browser) and the seating / venue blueprint editors
- Public wedding page with RSVP, registry, and playlist

## Two ways to store data

| Mode | When | Where data lives |
| --- | --- | --- |
| `local` | Phone preview, or no Firebase project yet | This browser only (`localStorage`). A preview login is created for you. |
| `firebase` | The original project, or your own | Cloud Firestore, Firebase Auth, and Storage |

Set the mode in `.env.local`:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_DATA_MODE=local` is the default in `.env.example`. Next.js inlines `NEXT_PUBLIC_*` values when the dev server starts and when you run `npm run build`, so restart or rebuild after changing them. A production image should be built with `NEXT_PUBLIC_DATA_MODE=firebase` (the Dockerfile does this).

### Preview login (local mode only)

This is not a real person and it is not created in Firebase.

- Email: `demo@example.com`
- Password: `demopassword123`

On the login screen, use **Fill preview login**. You can also register any email; it stays in this browser. **Forgot password** sets a new password here. It does not send email in local mode.

Create a wedding under **Wedding Details**, then open **View Site**. Guest links only work in the same browser that created them.

### Firebase mode

The app still has the original web config for project `the-big-day-31aox` as a fallback in `src/lib/firebase-config.ts`. Override it with `NEXT_PUBLIC_FIREBASE_*` for a different project. Turn on **Email/Password** authentication. Deploy the rules before the public site or guest RSVPs will be rejected:

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

## Email invitations

Preview and **Copy link** work without a mail server. **Send email** needs SMTP:

- `SMTP_HOST`
- `SMTP_PORT` (usually `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional)
- `SMTP_SECURE=true` only for port 465

Until those are set, the API responds with a clear message instead of a mail error.

## Deploy

The app is Next.js with one server route (`/api/send-invitation`). A purely static host cannot send mail. Use a host that runs the Next.js server.

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
2. `firebase login` and `firebase use the-big-day-31aox` (or your project). `.firebaserc` already names the original project.
3. Deploy rules: `firebase deploy --only firestore:rules,storage`
4. For the Next.js app, use **Firebase App Hosting** (`apphosting.yaml`) or web frameworks with `firebase.json` hosting `source: "."`.

App Hosting needs a billing account. Set `NEXT_PUBLIC_DATA_MODE=firebase` and the Firebase web config as build environment variables, then connect the GitHub repo in the Firebase console.

Firebase Hosting alone, without the frameworks backend or App Hosting, cannot run the invitation API.

### Netlify

`netlify.toml` sets the Next.js build. In the Netlify UI, set `NEXT_PUBLIC_DATA_MODE=firebase` and the Firebase web keys, then deploy the repository. The Next.js runtime plugin serves the server route.

### Static export

Do not use `output: 'export'`. The invitation route and server-rendered public pages need a server. Local mode is only for a browser preview.

## Not finished, on purpose

- **Pricing** on the homepage is a placeholder. There is no checkout.
- **Sample quotes** are not real reviews.
- **Sample website** (`/weddings/sample`) uses the placeholder couple, date, and venue that were already in the marketing page. It does not save RSVPs.
- **Draw venue shape** on the seating canvas is still labeled as not available.
- **Genkit** (`src/ai`) is not connected to any screen. `GOOGLE_GENAI_API_KEY` does nothing until a flow is added.
- **Planner** checkboxes stay in this browser. They are not in Firestore.
- **Playlist votes** in Firebase mode can be overwritten by anyone who can open the site, because the rule allows updates that touch only `songs`. Say if you want votes locked to signed-in guests.
- Contact address `support@thebigday.app` is whatever was already on the page. It is not a confirmed inbox.

## Questions for László

1. Are the names, date, and venue on the sample site (Anna & Paul, 15 June 2026, The Enchanted Garden) staying as placeholders, or do you want them removed from the marketing page entirely?
2. Is Firebase project `the-big-day-31aox` still the one to deploy to? The API key in the repo still accepts requests.
3. Should guests RSVP without an account (current rules), and is it acceptable that an invitation link can open that guest’s name and email?
4. Do you want real payments for the Basic / Premium / Deluxe prices, or should that section be removed?
5. Which SMTP provider should send invitations?
6. Do you want a custom domain, and which region should App Hosting use?
7. Should planner progress sync across phones, or is this-browser storage enough?
8. Is the contact address `support@thebigday.app` real?
