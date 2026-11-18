# SafeCo SmartWater — Proposal Studio

A guided water-treatment proposal tool for SafeCo SmartWater Systems sales reps. Run it on a tablet at the kitchen table, or send it as a link so the homeowner can walk it on their phone and sign remotely.

## What it does

| Step | What the homeowner sees |
|---|---|
| **Welcome** | Branded intro, what we'll cover, the SafeCo promise and badges |
| **Homeowner** *(rep only)* | Customer and deal details (these fill the agreement), call / text / email shortcuts, activity log |
| **Your Water** | In-home test tiles (hardness, chlorine, TDS, iron, pH) with "needs treatment / within range" flags, plus the public **EWG Tap Water** report for the ZIP: each contaminant's level, how many times over the EWG health guideline it is, the legal limit, and which stage removes it |
| **How It Works** | "What we found → how we fix it" map, an interactive 7-stage RO walkthrough, a clickable softener tank cutaway, specs and the full product sheet |
| **Build System** *(rep only)* | Up to 4 options (A/B/C…), products and add-ons, live monthly payment, **red-line pricing** (reps can't go under the floor) |
| **Your Options** | Good / better / best cards with features compared; the homeowner picks one |
| **Savings** | A 20-year cost comparison chart (doing nothing vs. pay in full vs. finance) with break-even dots. Sliders adjust it to the household |
| **Payment** | Financing plans with estimated monthly payments, down payment, or pay in full; investment summary |
| **Agreement** | Site details, installation checklist, tap-to-initial acknowledgments, draw-or-type e-signatures. Produces the 2-page **Residential Installation & Material Fulfillment Agreement**, ready to print or save as PDF |

Also included:
- **Pipeline board**: Draft → Presented → Sent → Signed → Installed, with totals, close rate and average deal
- **Present mode**: full screen, no rep tools showing, arrow keys move between steps
- **Remote selling**: "Send to homeowner" makes a link (text / email / copy). The homeowner walks the same steps, picks an option and signs, then sends a "signed" link back. Opening that link, or pasting it into **Import signed link**, updates the deal on the rep's side
- **Offline**: once loaded, the app keeps working with no signal (basements, well houses)
- **Owner settings** (PIN, default `1234`): products, prices, red lines, add-ons, option presets, financing plans and lender links, tax rate, savings defaults, company info and rep names
- **Backup / Restore** to a JSON file

## EWG water data

There are three ways to load the report, so reps always have one that works:
1. **Pull EWG report**: calls `/api/ewg?zip=…`, a small server function (`api/ewg.js`) that reads the public EWG Tap Water Database page for that ZIP and returns its contaminants. It only exists once the app is deployed (see below). If EWG lists several utilities for the ZIP, the rep picks one.
2. **Paste report**: open the utility's page on ewg.org, select all, copy, and paste. The app finds the contaminants, their levels and the "×" multipliers.
3. **Add**: enter a contaminant by hand.

Health-guideline and legal-limit reference values live in `js/data.js` (`SC.CONTAMINANTS`). Check them against EWG's current figures before relying on them.

## Running it

It's a static site with no build step.

- **Quick look**: open `index.html` in a browser. Everything works except EWG auto-pull and shareable links, which need the app hosted.
- **Local server**: `python3 -m http.server 8080`, then open http://localhost:8080
- **Deploy (recommended)**: push this repo to **Vercel**. Static files are served as-is, and `api/ewg.js` becomes the EWG function automatically. Any static host (Netlify, GitHub Pages, S3) works too, but without the function, reps use Paste report.

## Where data lives

Proposals and settings are saved **in each device's browser** (localStorage). Nothing is sent to a server. A shared link carries its proposal inside the link itself. To move data between devices, use Backup / Restore. The settings PIN keeps reps out of pricing on a shared tablet. It is not real security.

## Customizing

- Products, prices, red lines, financing, company info: **Settings** in the app, or the defaults in `js/data.js`
- Copy for stages, softener layers, specs and the "About SafeCo" section: `js/data.js`
- Brand colors: CSS variables at the top of `css/styles.css`
- Images: `assets/` (logo, system photo, product sheet, app icons)

## Not included (yet)

These need a backend or third-party accounts: AI pitch scoring, built-in texting and calling, a shared team calendar (install dates can be added to Google Calendar), card payments through Stripe, lender APIs (plans can link to a lender's application page), CRM sync, and "opened" tracking on sent links.
