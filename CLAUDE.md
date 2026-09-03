# The Dental Solutions — project notes

Website for **The Dental Solutions (Dr. Kaustubh Patil)**, a dental clinic in Model Colony,
Shivajinagar, Pune. Built from an in-house de-branded Webflow-derived template; every design
token, image and animation is inherited unchanged from that base — **only content was rebranded**.

> **Separate project.** This repo is an independent copy. The earlier client sites
> (`dr-patil-dental-care.vercel.app`, `dental-clinica-rouge.vercel.app`) are different codebases
> and must never be touched from here.

## Clinic facts (source: Google Business Profile)
- Profile: https://maps.google.com/?cid=4187806642178671438 — 5.0★, 250 reviews
- Address: 3rd Floor, Grand Helios Building, 303, Off FC Rd, above Axis Bank,
  opp. Hotel Ambassador, Model Colony, Shivajinagar, Pune 411016 (Plus code GRHR+G4)
- Phone / WhatsApp: **+91 97654 07679** (`919765407679`)
- Website listed on the profile: `drkaustubhpatilpune.com` (domain currently does not resolve)
- Email: `hello@drkaustubhpatilpune.com` (placeholder — confirm with client)
- Hours: **Mon–Sat 9:00–18:00; Sunday closed** (single shift, no break window)
- Lead dentist: **Dr. Kaustubh Patil** — MDS (Periodontics), BDS; periodontist,
  implantologist & dental surgeon (source: the clinic's own Practo profile, linked from the GBP)

## Structure
- `index.html` — home; `about.html`, `service.html`, `blog.html`, `booking.html`
- `privacy/terms/cookies/licenses/404.html` — hand-built legal pages
- `admin/` — clinic management panel (dashboard, appointments, patients, doctors, revenue, settings)
- `assets/css/lumora.css` — the design system (filename kept; do not rename, all `url()`s depend on it)
- `assets/js/` — jQuery + Webflow IX2 runtime + GSAP/ScrollTrigger/SplitText. **Do not delete.**
  - `lumora-db.js` — the seed database (clinic, doctors, services, appointments) + auth
  - `booking-data.js` / `booking.js` — booking flow (booking-data.js overrides the lumora-db bridge)
  - `website-sync.js` — pushes admin edits onto the public pages
- `assets/img/` — all photos plus brand assets (`lumora-logo.svg`, `lumora-logo-dark.svg`, `favicon.svg`)
- `variant-blue/` — full copy recoloured teal → blue; it has **no** `lumora-db.js` and keeps its own
  `CLINIC` constant inside `booking-data.js`, so clinic data must be edited in both places
- `.bak/` — original template exports, reference only

## Hard invariants
- **Never change design, colours, fonts, spacing, images or animations.** Content only.
- Do not reintroduce `filter: blur(...)` in reveals — it leaves images permanently blurred.
- Keep the "Lumora reveal engine v2" script and the image-guard script before `</body>` on every page.

## Opening-hours model
`hours[day]` / `doctor.schedule[day]` support an optional `brk: { start, end }`. The slot generators
in both `lumora-db.js` (`getAvailability`) and `booking-data.js` (`windowFor` + its loop) skip any
slot overlapping that window — this is what produced the two-shift day on the previous client.
Sunday is `closed: true` (root) / `null` (variant-blue). This clinic currently has `brk: null`
on every open day, so the break logic is dormant but intact.

## Local storage note
Seed data is cached in `localStorage` under `tds_db_v1`. After changing seed data, bump that key
or clear storage, otherwise stale content keeps rendering.

## Run locally
```
node local-server.js
# http://localhost:8123
```

## Open items
- Confirm the real clinic email with the client (currently a placeholder).
- Real social profile URLs (currently `#`) and a real OG image.
- Team page shows Dr. Kaustubh Patil plus three role-titled staff cards (no invented names) —
  swap in real names when the client provides them.
