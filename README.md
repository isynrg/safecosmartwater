# SafeCo Pro — website (safecopro.com)

Static site (no build step). Open `index.html` or deploy the folder to any static host (Vercel, Netlify, GitHub Pages).

- `index.html` — page structure and copy
- `styles.css` — design system (Apple-inspired, light/dark sections, responsive)
- `main.js` — scroll effects, reveal animations, card tilt, contact form, and the Three.js 3D hero
- `assets/img/` — imagery generated with Higgsfield (WebP)
- `assets/vendor/` — GSAP 3.12.5, ScrollTrigger, Three.js r128 (vendored, no CDN needed)
- `smartwater/` — **SafeCo SmartWater** water-treatment funnel, served at `/smartwater` (lead form: set `LEAD_ENDPOINT` in `smartwater/main.js`)
- `vercel.json` — clean URLs (`/smartwater`) and asset caching

FloQuote (the proposal app on floquote.pro) lives on a different branch and Vercel project; this site never deploys there.

## Before launch
- **Contact form:** set `FORM_ENDPOINT` (e.g. a Formspree URL or CRM webhook) and `CONTACT_EMAIL` at the top of `main.js`. Without an endpoint the form opens an email draft to `CONTACT_EMAIL`.
- Add phone number / address / license numbers to the footer if wanted.
