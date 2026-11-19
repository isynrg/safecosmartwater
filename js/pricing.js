/* SafeCo SmartWater System — pricing defaults (team members only).
 * The server only sends this file to signed-in users (see middleware.js).
 * Owners change these values in Settings; edits are saved on the device.
 */
var SC = window.SC = window.SC || {};
SC.DEFAULTS = {
  company: {
    name: "SafeCo SmartWater Systems",
    tagline: "Better water. Better living.",
    phone: "(972) 472-2949",
    email: "",
    website: "www.safecopro.com",
    address: "2300 Valley View Ln, Irving, TX 75062",
    hours: "Monday – Friday | 8:00 AM – 5:00 PM CST",
    salesOrg: "SafeCo SmartWater Systems",
  },
  settingsPin: "1234",
  taxRate: 8.25,            // % applied to equipment only
  installFee: 0,            // default installation line on the agreement
  depositPct: 10,           // suggested deposit when paying in full / financing
  reps: ["Sales Rep"],
  products: [
    {
      id: "complete-home",
      name: "Complete Home Softener & Filtration System",
      short: "Hydro Spring softener + HW800 AlkaPro RO",
      category: "Bundle",
      price: 7999,
      redLine: 6499,
      image: "assets/system.jpg",
      treats: ["hardness", "chlorine", "chloramine", "voc", "taste", "tds", "metals", "pfas", "nitrate", "micro"],
      bullets: [
        "48,000-grain softener with coconut-shell carbon",
        "7-stage reverse osmosis with alkaline remineralizer",
        "Whole-home soft, filtered water + ultra-pure drinking water",
      ],
      includes: ["softener", "carbon", "ro", "alkaline", "install"],
    },
    {
      id: "hydro-spring",
      name: "Hydro Spring Softener + Carbon",
      short: "Whole-home soft & filtered water",
      category: "Whole Home",
      price: 5499,
      redLine: 4499,
      image: "assets/system.jpg",
      treats: ["hardness", "chlorine", "chloramine", "voc", "taste"],
      bullets: [
        "48,000-grain capacity · 27 GPM system flow",
        "50 lbs USA-made 10% crosslinked resin",
        "15 lbs granular activated coconut-shell carbon",
      ],
      includes: ["softener", "carbon", "install"],
    },
    {
      id: "hw800-alkapro",
      name: "HW800 AlkaPro Reverse Osmosis",
      short: "7-stage drinking water with alkaline remineralizer",
      category: "Drinking Water",
      price: 2999,
      redLine: 2299,
      image: "assets/system.jpg",
      treats: ["tds", "metals", "pfas", "nitrate", "micro", "chlorine", "taste"],
      bullets: [
        "95–99% rejection NSF thin-film RO membrane, 100 GPD",
        "Double NSF carbon block + 2 coconut GAC polishers",
        "Alkaline remineralizer for great-tasting water",
      ],
      includes: ["ro", "alkaline", "install"],
    },
  ],
  addons: [
    { id: "recycle", name: "Removal & recycling of old system", price: 150 },
    { id: "ice", name: "Connect ice maker / fridge to RO", price: 100 },
    { id: "drill", name: "Drill countertop for RO faucet", price: 100 },
    { id: "board", name: "Mounting board installation", price: 100 },
    { id: "loop", name: "Install softener loop / bypass", price: 350 },
    { id: "filters1", name: "1-year filter & salt delivery plan", price: 299 },
  ],
  financePlans: [
    { id: "f120", lender: "Financing Partner", label: "Low monthly · 120 mo", apr: 9.99, term: 120, applyUrl: "" },
    { id: "f60", lender: "Financing Partner", label: "Pay off faster · 60 mo", apr: 7.99, term: 60, applyUrl: "" },
    { id: "f12", lender: "Financing Partner", label: "12 months same-as-cash", apr: 0, term: 12, applyUrl: "" },
  ],
  // Default three-option presentation (good / better / best).
  optionPresets: [
    { label: "Option A", name: "Drinking Water", items: ["hw800-alkapro"] },
    { label: "Option B", name: "Whole Home", items: ["hydro-spring"] },
    { label: "Option C", name: "Complete Home", items: ["complete-home"], recommended: true },
  ],
  savings: {
    bottled: 45,        // $/month on bottled water, pitchers, filters
    soaps: 25,          // $/month extra on soaps, detergents, cleaners due to hard water
    appliances: 250,    // $/year shortened appliance life / repairs / plumbing
    energy: 120,        // $/year water heater efficiency lost to scale
    upkeepSoftener: 120, // $/year salt + carbon upkeep for the softener
    upkeepRO: 80,       // $/year RO filter changes
    inflation: 3,       // %/year
    years: 20,
  },
};
