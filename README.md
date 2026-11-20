# SafeCo SmartWater: Story Website

A single-page, scroll-driven story site for **SafeCo SmartWater Systems** (Irving, TX).

## Story structure
| Chapter | Section | What it does |
|---|---|---|
| Intro | Preloader | Water-drop + ripple reveal: "Every glass tells a story." |
| Prologue | Hero | "It looks clean. That's the problem." with animated caustic light |
| I | The Journey | Sticky image + 4-step story from source water to your tap |
| II | A Closer Look | **WebGL 3D** pinned scene: a chrome faucet pours into a glass, the camera orbits in bullet-time as the water **freezes** into ice crystals (splash droplets hang mid-air), dives **into the stream**, then flies through glowing 3D molecules of **10 labeled contaminants** |
| III | What's Inside | Filterable contaminant index: legal limit vs. health guideline, and which SafeCo stage reduces it |
| IV | Your Home | Hard-water symptoms + household water calculator |
| V | Your Water | ZIP lookup that opens the **EWG Tap Water Database** for that ZIP |
| VI | The Solution | Product showcase: 4-stage system with specs from the install agreement |
| VII | Skip the Sale | "Skip the sale, go to service" promise, install timeline, and news articles linking to EPA / USGS / EWG sources |
| VIII | Your Move | Free water test booking form |

## Files
- `index.html`: markup and copy
- `styles.css`: design system and layout
- `scene3d.js`: three.js 3D hero droplet + Chapter II scene (bloom, lens/grain post-processing). Loads three.js 0.160 from jsDelivr
- `main.js`: scroll effects, 3D card tilt, data (contaminants, stages, news), forms, and a 2D canvas fallback for the freeze scene when WebGL isn't available

No build step. Serve the folder over HTTP (ES modules don't load from `file://`) or deploy the folder to any static host (Vercel, Netlify, GitHub Pages).

## Connect the booking form to your CRM
Set `LEAD_ENDPOINT` at the top of `main.js` (or define `window.SAFECO_LEAD_ENDPOINT` before `main.js` loads) to a webhook URL
(Zapier, Make, HubSpot, GoHighLevel, etc.). Leads are POSTed as JSON:
`name, phone, zip, email, concern, time, source, submittedAt, page`.
Until an endpoint is set, the form validates and then prompts the visitor to call (972) 472-2949.

## Imagery
Images were generated with Higgsfield and load from Higgsfield's CDN.
