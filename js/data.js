/* SafeCo SmartWater Proposal Studio — default data.
 * Everything here is a DEFAULT. Owners can change products, prices, red lines,
 * financing and company info from Settings; those edits are stored on the device.
 */
var SC = (typeof window !== "undefined") ? (window.SC = window.SC || {}) : {};
if (typeof module !== "undefined" && module.exports) module.exports = SC;

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

/* Product specifications (from the SafeCo product sheet + installation agreement). */
SC.SPECS = [
  ["Valve", "SafeCo ProValve Digital Control Valve"],
  ["Softener Capacity", "48,000 Grains"],
  ["Valve Flow Rate", "28 GPM"],
  ["System Flow Rate", "27 GPM"],
  ["Bypass", "1\" Integrated Bypass"],
  ["Resin Volume", "50 lbs"],
  ["Carbon Media", "15 lbs Coconut Shell Activated Carbon"],
  ["Media Tank Size", "10\" x 54\""],
  ["Brine Tank Size", "15\" x 35\""],
];

/* The 7 stages of the HW800 AlkaPro RO (from the product sheet). */
SC.RO_STAGES = [
  { n: "1", title: "Sediment Pre-Filter", tag: "5 micron", color: "#e9eef5",
    text: "5 micron polypropylene sediment pre-filter extracts suspended materials — sand, rust, silt — so every stage after it lasts longer.",
    removes: ["Sand & silt", "Rust particles", "Suspended solids"] },
  { n: "2–3", title: "Double Carbon Block", tag: "NSF", color: "#2a2f36",
    text: "Two NSF carbon block filters absorb heavy chlorine by-products such as chloramine, THMs and TCE. The double carbon briquettes filter organic matter without releasing carbon fines, and prepare water to enter the RO element.",
    removes: ["Chlorine & chloramine", "THMs / disinfection by-products", "TCE & VOCs", "Organic matter"] },
  { n: "4", title: "RO Membrane", tag: "95–99% rejection", color: "#1f6fe0",
    text: "High-rejection (95–99%) NSF thin-film composite RO membrane, 100 GPD. Rejects a wide spectrum of impurities including total dissolved solids (TDS), heavy metals, bacteria and viruses.",
    removes: ["Total dissolved solids", "Lead, arsenic & heavy metals", "PFAS ‘forever chemicals’", "Nitrates", "Bacteria & viruses"] },
  { n: "5", title: "Coconut Shell GAC", tag: "NSF in-line", color: "#2a2f36",
    text: "In-line NSF coconut-shell granular activated carbon removes dissolved gases, bad taste and odor from product water.",
    removes: ["Dissolved gases", "Taste", "Odor"] },
  { n: "6", title: "Alkaline Remineralizer", tag: "Better taste", color: "#f2f4f7",
    text: "Internal alkaline remineralizer improves hydration, supplements healthy minerals and balances the pH of your water. Makes purified water taste great.",
    removes: ["Raises pH", "Adds calcium & magnesium", "Smooth taste"] },
  { n: "7", title: "Final Coconut GAC Polish", tag: "NSF in-line", color: "#2a2f36",
    text: "An additional in-line NSF coconut-shell GAC filter removes any remaining dissolved gases, taste and odor right before the faucet.",
    removes: ["Final polish", "Taste & odor"] },
];

/* Layers of the Hydro Spring softener tank (top to bottom). */
SC.SOFTENER_LAYERS = [
  { title: "ProValve — Modern Design", color: "#1b2330",
    points: ["Ceramic discs for longer life and reduced maintenance", "Highly configurable with an easy-to-use program interface", "Long-term memory for program functions", "72-hour memory backup"] },
  { title: "Granular Activated Coconut Shell Carbon", color: "#30343a",
    points: ["Treats chlorine, chloramine and harmful contaminants", "Eco-friendly — sustainably sourced from renewable materials", "Designed for maximum filtration capacity and extended performance"] },
  { title: "USA-Made High-Capacity Softening Resin", color: "#e88a1a",
    points: ["10% crosslinked resin removes hardness and lasts longer", "Resists chlorine and oxidation for a longer lifespan", "Delivers high-flow soft water with no pressure loss"] },
  { title: "Polishing Gravel", color: "#55606c",
    points: ["Supports the resin for optimal flow and efficiency", "Prevents channeling and ensures even water distribution"] },
];

/* In-home test readings the rep can log. "limit" = level above which we recommend treatment. */
SC.TESTS = [
  { id: "hardness", label: "Hardness", unit: "gpg", limit: 3, max: 40, step: 0.5,
    help: "Above 3 gpg is considered hard. Causes scale, spots, dry skin and shortens appliance life." },
  { id: "chlorine", label: "Chlorine", unit: "ppm", limit: 0.5, max: 5, step: 0.1,
    help: "Added by the city to disinfect. Affects taste, odor, skin and hair, and forms by-products like THMs." },
  { id: "tds", label: "TDS", unit: "ppm", limit: 300, max: 1500, step: 10,
    help: "Total dissolved solids — everything dissolved in the water. EPA secondary standard is 500 ppm; we treat above 300 for drinking water." },
  { id: "iron", label: "Iron", unit: "ppm", limit: 0.3, max: 5, step: 0.1,
    help: "Above 0.3 ppm causes orange staining and metallic taste (EPA secondary standard)." },
  { id: "ph", label: "pH", unit: "", limit: null, range: [6.5, 8.5], max: 14, step: 0.1,
    help: "EPA recommends 6.5–8.5. Low pH is corrosive to plumbing; high pH tastes bitter." },
];

/* Contaminant library. Guidelines are REFERENCE values commonly published by EWG (health
 * guideline) and EPA (legal limit). Always confirm against the live EWG report for the address. */
SC.CONTAMINANTS = [
  { key: "Total trihalomethanes (TTHMs)", alias: ["TTHM", "trihalomethanes"], unit: "ppb", ewg: 0.15, legal: 80, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Chloroform", alias: [], unit: "ppb", ewg: 0.4, legal: 80, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Bromodichloromethane", alias: [], unit: "ppb", ewg: 0.06, legal: 80, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Dibromochloromethane", alias: ["Chlorodibromomethane"], unit: "ppb", ewg: 0.1, legal: 80, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Bromoform", alias: [], unit: "ppb", ewg: 0.5, legal: 80, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Haloacetic acids (HAA5)", alias: ["HAA5"], unit: "ppb", ewg: 0.1, legal: 60, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Haloacetic acids (HAA9)", alias: ["HAA9"], unit: "ppb", ewg: 0.06, legal: null, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Dichloroacetic acid", alias: [], unit: "ppb", ewg: 0.2, legal: 60, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Trichloroacetic acid", alias: [], unit: "ppb", ewg: 0.1, legal: 60, effect: "Cancer", group: "Disinfection by-product", fix: "Carbon + RO" },
  { key: "Chlorate", alias: [], unit: "ppb", ewg: 210, legal: null, effect: "Thyroid", group: "Disinfection by-product", fix: "RO" },
  { key: "Arsenic", alias: [], unit: "ppb", ewg: 0.004, legal: 10, effect: "Cancer", group: "Heavy metal", fix: "RO" },
  { key: "Lead", alias: [], unit: "ppb", ewg: 0.2, legal: 15, effect: "Brain & nervous system", group: "Heavy metal", fix: "RO" },
  { key: "Chromium (hexavalent)", alias: ["Chromium-6", "hexavalent chromium"], unit: "ppb", ewg: 0.02, legal: null, effect: "Cancer", group: "Heavy metal", fix: "RO" },
  { key: "Manganese", alias: [], unit: "ppb", ewg: 100, legal: null, effect: "Nervous system", group: "Heavy metal", fix: "Softener + RO" },
  { key: "Nitrate", alias: ["Nitrate and nitrite"], unit: "ppm", ewg: 0.14, legal: 10, effect: "Cancer", group: "Agricultural", fix: "RO" },
  { key: "Radium (combined)", alias: ["Radium", "Radium-226", "Radium-228"], unit: "pCi/L", ewg: 0.05, legal: 5, effect: "Cancer", group: "Radiological", fix: "Softener + RO" },
  { key: "Uranium", alias: [], unit: "pCi/L", ewg: 0.43, legal: 20, effect: "Cancer", group: "Radiological", fix: "RO" },
  { key: "PFOA", alias: ["Perfluorooctanoic acid"], unit: "ppt", ewg: 0.007, legal: 4, effect: "Cancer · hormones", group: "PFAS (forever chemicals)", fix: "RO" },
  { key: "PFOS", alias: ["Perfluorooctane sulfonate"], unit: "ppt", ewg: 0.001, legal: 4, effect: "Immune · hormones", group: "PFAS (forever chemicals)", fix: "RO" },
  { key: "PFBA", alias: ["Perfluorobutanoic acid"], unit: "ppt", ewg: null, legal: null, effect: "Under study", group: "PFAS (forever chemicals)", fix: "RO" },
  { key: "PFHxS", alias: [], unit: "ppt", ewg: null, legal: 10, effect: "Hormones", group: "PFAS (forever chemicals)", fix: "RO" },
  { key: "1,4-Dioxane", alias: ["Dioxane"], unit: "ppb", ewg: 0.35, legal: null, effect: "Cancer", group: "Industrial", fix: "Carbon + RO" },
  { key: "Fluoride", alias: [], unit: "ppm", ewg: null, legal: 4, effect: "Bone & development", group: "Additive", fix: "RO" },
];

/* About SafeCo — used on the welcome screen. */
SC.ABOUT = {
  headline: "Built for better living.",
  intro: "SafeCo SmartWater Systems designs, installs and services complete home water treatment for Texas families — soft, filtered water at every tap and pure, mineral-rich drinking water from the kitchen faucet.",
  pillars: [
    { icon: "drop", title: "Cleaner Water", text: "Multi-stage filtration targets chlorine by-products, heavy metals, PFAS and more." },
    { icon: "leaf", title: "Healthier Family", text: "Softer skin and hair, and alkaline drinking water that tastes great." },
    { icon: "shield", title: "Protects Appliances", text: "Soft water stops scale that wears out water heaters, dishwashers and fixtures." },
    { icon: "home", title: "Better Living", text: "Professional installation, startup, calibration and a walkthrough of your new system." },
  ],
  badges: ["Proudly Made in Texas", "Lifetime Warranty", "BBB", "NSF Sustainability Certified"],
  promise: [
    "Free in-home water test",
    "Professional installation by trained SafeCo installers",
    "1-year workmanship warranty + manufacturer equipment warranty",
    "System startup, calibration & customer orientation",
  ],
};
