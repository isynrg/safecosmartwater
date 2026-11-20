# SafeCo SmartWater: Story Website

A single-page, scroll-driven story site for **SafeCo SmartWater Systems** (Irving, TX).

## Story structure
| Chapter | Section | What it does |
|---|---|---|
| Intro | Preloader | Water-drop + ripple reveal: "Every glass tells a story." |
| Prologue | Hero | "It looks clean. That's the problem." with animated caustic light |
| I | The Journey | Sticky image + 4-step story from source water to your tap |
| II | A Closer Look | Pinned scroll scene: faucet stream slows, **freezes**, the camera **zooms in**, and a microscope view reveals **10 labeled contaminants** |
| III | What's Inside | Filterable contaminant index: legal limit vs. health guideline, and which SafeCo stage reduces it |
| IV | Your Home | Hard-water symptoms + household water calculator |
| V | Your Water | ZIP lookup that opens the **EWG Tap Water Database** for that ZIP |
| VI | The Solution | Product showcase: 4-stage system with specs from the install agreement |
| VII | Skip the Sale | "Skip the sale, go to service" promise, install timeline, and news articles linking to EPA / USGS / EWG sources |
| VIII | Your Move | Free water test booking form |

## Files
- `index.html`: markup and copy
- `styles.css`: design system and layout
- `main.js`: scroll effects, freeze/zoom canvas scene, data (contaminants, stages, news), and forms

No build step. Open `index.html` or deploy the folder to any static host (Vercel, Netlify, GitHub Pages).

## Connect the booking form to your CRM
Set `LEAD_ENDPOINT` at the top of `main.js` (or define `window.SAFECO_LEAD_ENDPOINT` before `main.js` loads) to a webhook URL
(Zapier, Make, HubSpot, GoHighLevel, etc.). Leads are POSTed as JSON:
`name, phone, zip, email, concern, time, source, submittedAt, page`.
Until an endpoint is set, the form validates and then prompts the visitor to call (972) 472-2949.

## Imagery
Images were generated with Higgsfield and load from Higgsfield's CDN.
