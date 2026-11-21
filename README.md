# Safeco Pro — website

Static site (no build step). Open `index.html` or deploy the folder to any static host (Vercel, Netlify, GitHub Pages).

- `index.html` — page structure and copy
- `styles.css` — design system (Apple-inspired, light/dark sections, responsive)
- `main.js` — scroll effects, reveal animations, card tilt, contact form, and the Three.js 3D hero
- `assets/img/` — imagery generated with Higgsfield (WebP)
- `assets/vendor/` — GSAP 3.12.5, ScrollTrigger, Three.js r128 (vendored, no CDN needed)

## Before launch
- **Contact form:** set `FORM_ENDPOINT` (e.g. a Formspree URL or CRM webhook) and `CONTACT_EMAIL` at the top of `main.js`. Without an endpoint the form opens an email draft to `CONTACT_EMAIL`.
- Add phone number / address / license numbers to the footer if wanted.
