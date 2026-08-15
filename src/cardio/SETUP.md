# Cardio Feedback — Strava setup & verification

## 1. Strava application settings

<https://www.strava.com/settings/api>

**Authorization Callback Domain** must be the bare domain — no scheme, no path,
no trailing slash:

```
workout-six-mauve.vercel.app
```

Strava matches only the domain; the app supplies the full redirect path
(`/api/strava/callback`) when it builds the authorize URL.

## 2. Vercel environment variables

Project → Settings → Environment Variables. Set all three for **Production,
Preview and Development**, then **redeploy** — Vite inlines `VITE_*` at build
time, so a redeploy is required for them to take effect.

| Name | Value | Why |
| --- | --- | --- |
| `VITE_STRAVA_CLIENT_ID` | Client ID | bundled into the frontend to build the authorize URL |
| `STRAVA_CLIENT_ID` | same Client ID | read server-side by `/api/strava/*` for the token exchange |
| `STRAVA_CLIENT_SECRET` | Client Secret | server-side only |

`STRAVA_CLIENT_SECRET` must **never** carry a `VITE_` prefix — that would ship
it inside the browser bundle.

## 3. The scope gotcha

**The "Your Access Token" shown on the Strava settings page has scope `read`
and cannot read activities.** It is not the token the app uses, and it will fail
against `/athlete/activities`, `/activities/{id}/streams` and `/athlete/zones`.

The app requests `activity:read_all,profile:read_all` through the OAuth flow. To
get a usable token for scripts, connect in the app and copy the
`strava_access_token` cookie from devtools (valid ~6h; the app refreshes it
automatically, the scripts do not).

Anyone who connected before the `profile:read_all` scope was added must
reconnect, or zones/FTP will come back empty and the app will fall back to a
manual max-HR entry.

## 4. Where the app lives

The cardio feedback app is a separate entry point:

```
https://<your-domain>/cardio.html
```

`/` still serves the original routine tracker.

## 5. Verify the integration

Confirms the token, scopes, streams, laps, splits and zones all arrive, and
prints what the structuring step made of them:

```bash
# most recent cardio activity
npx tsx scripts/verify-strava.mjs --token <accessToken>

# a specific one, with the anchors that unlock pace targets
npx tsx scripts/verify-strava.mjs \
  --token <accessToken> --id 19642518909 --intent vo2max \
  --max-hr 190 --threshold-pace 7:30
```

Rate limits on the standard tier are 200 reads/15min and 2,000/day; a full run
uses about four requests.

## 6. Capture eval fixtures

Saves a real session (GPS scrubbed) to `evals/fixtures/` for the eval set:

```bash
node scripts/capture-fixture.mjs 19642518909 --token <accessToken>
```

Then re-run the verifier offline against it:

```bash
npx tsx scripts/verify-strava.mjs \
  --fixture evals/fixtures/19642518909.json --intent vo2max --threshold-pace 7:30
```
