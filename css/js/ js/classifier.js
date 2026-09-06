/*
  Hostel Care — issue classifier
  There is no Python/scikit-learn backend in this version, so category
  and priority are detected with a keyword-scoring rule set instead of
  a trained model. It reads the complaint text and returns the same
  shape of result (category, priority, confidence) the original
  ML-based classifier produced.
*/
(function (global) {
  const CATEGORY_KEYWORDS = {
    Plumbing: ["water", "tap", "leak", "pipe", "drain", "toilet", "flush", "bathroom", "shower", "sink", "seepage"],
    Electronics: ["wire", "wiring", "switch", "socket", "light", "bulb", "fan", "plug", "electric", "electricity", "wifi", "router", "ac", "cooler", "shock", "spark"],
    Furniture: ["chair", "table", "bed", "mattress", "cupboard", "wardrobe", "almirah", "shelf", "desk", "lock"],
    Structural: ["wall", "ceiling", "crack", "roof", "floor", "door", "window", "paint", "plaster", "leakage"],
  };

  const HIGH_URGENCY = ["urgent", "emergency", "danger", "dangerous", "fire", "shock", "spark", "flooding", "flood", "safety", "smoke", "broken lock", "gas"];
  const MEDIUM_URGENCY = ["not working", "broken", "repair", "problem", "issue", "damaged", "stuck"];

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
    let best = "Other";
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

  global.Classifier = { classify };
})(window);
