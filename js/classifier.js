/*
  Hostel Care — issue classifier
  Reads the complaint text and sorts it into a worker role (Plumber,
  Electrician, Carpenter, Mess) or General for anything else, plus an
  urgency level — using keyword scoring instead of a trained model.

  Also maps labels from the photo AI (MobileNet, see submit-complaint.html)
  to the same categories, so a photo can support the text-based guess.
*/
(function (global) {
  const CATEGORY_KEYWORDS = {
    Plumber: ["water", "tap", "leak", "pipe", "drain", "toilet", "flush", "bathroom", "shower", "sink", "seepage"],
    Electrician: ["wire", "wiring", "switch", "socket", "light", "bulb", "fan", "plug", "electric", "electricity", "wifi", "router", "ac", "cooler", "shock", "spark"],
    Carpenter: ["chair", "table", "bed", "mattress", "cupboard", "wardrobe", "almirah", "shelf", "desk", "lock", "door", "window", "wall", "ceiling", "crack", "roof", "floor", "paint", "plaster"],
    Mess: ["food", "mess", "dining", "canteen", "meal", "breakfast", "lunch", "dinner", "kitchen", "hygiene", "cockroach", "insect", "spoiled", "stale", "chef", "cook"],
  };

  const HIGH_URGENCY = ["urgent", "emergency", "danger", "dangerous", "fire", "shock", "spark", "flooding", "flood", "safety", "smoke", "broken lock", "gas", "food poisoning"];
  const MEDIUM_URGENCY = ["not working", "broken", "repair", "problem", "issue", "damaged", "stuck"];

  const IMAGE_CATEGORY_HINTS = {
    Plumber: ["toilet", "seat", "wash basin", "washbasin", "sink", "tub", "bathtub", "shower", "faucet", "pipe", "plunger", "drain"],
    Electrician: ["switch", "socket", "plug", "power", "electric", "space heater", "fan", "lamp", "light", "bulb", "television", "router", "modem", "wire"],
    Carpenter: ["chair", "desk", "table", "wardrobe", "cabinet", "shelf", "bed", "four-poster", "cradle", "rocking chair", "file", "bookcase", "door", "window", "lock", "wall clock"],
    Mess: ["plate", "tray", "dining table", "food", "meal", "bowl", "cup", "spoon", "fork", "refrigerator", "microwave", "stove", "frying pan", "pot"],
  };

  function scoreCategory(text) {
    const scores = {};
    let total = 0;
    Object.keys(CATEGORY_KEYWORDS).forEach((cat) => {
      let hits = 0;
      CATEGORY_KEYWORDS[cat].forEach((kw) => {
        if (text.includes(kw)) hits += 1;
      });
      scores[cat] = hits;
      total += hits;
    });
    let best = "General";
    let bestScore = 0;
    Object.keys(scores).forEach((cat) => {
      if (scores[cat] > bestScore) {
        best = cat;
        bestScore = scores[cat];
      }
    });
    const confidence = total > 0 ? Math.min(0.6 + (bestScore / Math.max(total, 1)) * 0.35, 0.97) : 0.55;
    return { category: best, confidence };
  }

  function scorePriority(text) {
    if (HIGH_URGENCY.some((kw) => text.includes(kw))) return "high";
    if (MEDIUM_URGENCY.some((kw) => text.includes(kw))) return "medium";
    return "low";
  }

  function classify(title, description) {
    const text = ((title || "") + " " + (description || "")).toLowerCase();
    const { category, confidence } = scoreCategory(text);
    const priority = scorePriority(text);
    return {
      category,
      priority,
      confidence: Math.round(confidence * 100),
    };
  }

  // Given a raw label from the photo AI (e.g. "washbasin, handbasin"),
  // guess which of our categories it best matches. Returns null if no
  // keyword matches, rather than forcing a wrong guess.
  function hintFromImageLabel(label) {
    const lower = (label || "").toLowerCase();
    for (const cat of Object.keys(IMAGE_CATEGORY_HINTS)) {
      if (IMAGE_CATEGORY_HINTS[cat].some((kw) => lower.includes(kw))) return cat;
    }
    return null;
  }

  global.Classifier = { classify, hintFromImageLabel };
})(window);
