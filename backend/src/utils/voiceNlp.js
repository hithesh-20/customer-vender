/**
 * Bilingual Kannada + Kanglish + English Voice Commerce NLP Engine
 * Parses natural spoken vendor commands into actionable database operations.
 */

const NUMBER_WORDS = {
  // Kannada script & transliteration + English
  ಒಂದು: 1, ondu: 1, one: 1,
  ಎರಡು: 2, eradu: 2, two: 2,
  ಮೂರು: 3, mooru: 3, three: 3,
  ನಾಲ್ಕು: 4, nalku: 4, four: 4,
  ಐದು: 5, aidu: 5, five: 5,
  ಆರು: 6, aaru: 6, six: 6,
  ಏಳು: 7, elu: 7, seven: 7,
  ಎಂಟು: 8, entu: 8, eight: 8,
  ಒಂಬತ್ತು: 9, ombattu: 9, nine: 9,
  ಹತ್ತು: 10, hattu: 10, ten: 10,
  ಹದಿನೈದು: 15, fifteen: 15,
  ಇಪ್ಪತ್ತು: 20, ippattu: 20, twenty: 20,
  ಇಪ್ಪತ್ತೈದು: 25, twentyfive: 25,
  ಮೂವತ್ತು: 30, thirty: 30,
  ಐವತ್ತು: 50, aivattu: 50, fifty: 50,
  ನೂರು: 100, nooru: 100, hundred: 100,
  ಇನ್ನೂರು: 200, innooru: 200,
  ಐನೂರು: 500, ainooru: 500,
  ಸಾವಿರ: 1000, saavira: 1000,
  ಅರ್ಧ: 0.5, ardha: 0.5, half: 0.5,
};

const PRODUCT_SYNONYMS = [
  { keywords: ['ಟೊಮ್ಯಾಟೋ', 'ಟೊಮೆಟೊ', 'tomato', 'tomatoes', 'tamato'], canonical: 'Tomato' },
  { keywords: ['ಬಾಸ್ಮತಿ', 'ಅಕ್ಕಿ', 'basmati', 'basmathi', 'rice', 'akki'], canonical: 'Rice' },
  { keywords: ['ಹಾಲು', 'ನಂದಿನಿ ಹಾಲು', 'milk', 'haalu', 'halu'], canonical: 'Milk' },
  { keywords: ['ಈರುಳ್ಳಿ', 'ನೀರುಳ್ಳಿ', 'onion', 'onions', 'eerulli'], canonical: 'Onion' },
  { keywords: ['ಆಲೂಗಡ್ಡೆ', 'ಬಟಾಟೆ', 'potato', 'potatoes', 'aalugadde'], canonical: 'Potato' },
  { keywords: ['ಸಕ್ಕರೆ', 'sugar', 'sakkare'], canonical: 'Sugar' },
  { keywords: ['ಬಾಳೆಹಣ್ಣು', 'ಬಾಳೆ', 'banana', 'bananas', 'baalehannu'], canonical: 'Banana' },
  { keywords: ['ತೆಂಗಿನ ಎಣ್ಣೆ', 'ಎಣ್ಣೆ', 'coconut oil', 'sunflower oil', 'oil', 'enne'], canonical: 'Oil' },
  { keywords: ['ಗೋಧಿ', 'ಹಿಟ್ಟು', 'wheat', 'atta', 'flour', 'godhi'], canonical: 'Wheat' },
  { keywords: ['ಮೊಸರು', 'curd', 'mosaru', 'yogurt'], canonical: 'Curd' },
  { keywords: ['ತುಪ್ಪ', 'ghee', 'tuppa'], canonical: 'Ghee' },
  { keywords: ['ಸೇಬು', 'apple', 'apples', 'sebu'], canonical: 'Apple' },
  { keywords: ['ಪನೀರ್', 'paneer'], canonical: 'Paneer' },
  { keywords: ['ಬೆಲ್ಲ', 'jaggery', 'bella'], canonical: 'Jaggery' },
];

function detectLanguage(text) {
  // Kannada Unicode block: 0C80–0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  return 'en';
}

function extractQuantity(text) {
  const numericMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (numericMatch) {
    return parseFloat(numericMatch[1]);
  }
  const tokens = text.toLowerCase().split(/[\s,.-]+/);
  for (const token of tokens) {
    if (NUMBER_WORDS[token] !== undefined) {
      return NUMBER_WORDS[token];
    }
  }
  return null;
}

function extractRupeeAmount(text) {
  const rsMatch = text.match(/(?:₹|rs\.?|rupees?|ರೂಪಾಯಿ|ರೂ)\s*(\d+(?:\.\d+)?)/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|ರೂಪಾಯಿ|ರೂ)/i);
  if (rsMatch) return parseFloat(rsMatch[1]);
  const allNums = [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => parseFloat(m[1]));
  if (allNums.length > 0) return Math.max(...allNums);
  return extractQuantity(text);
}

function matchProductFromCatalog(text, products = []) {
  const lower = text.toLowerCase();

  // 1. Direct match against catalog name or Kannada name
  for (const prod of products) {
    const pName = (prod.name || '').toLowerCase();
    const kName = (prod.kannadaName || '').trim();
    if ((pName && lower.includes(pName)) || (kName && text.includes(kName))) {
      return prod;
    }
  }

  // 2. Synonym dictionary match -> fuzzy match in catalog
  for (const entry of PRODUCT_SYNONYMS) {
    if (entry.keywords.some((kw) => lower.includes(kw.toLowerCase()) || text.includes(kw))) {
      const target = entry.canonical.toLowerCase();
      const found = products.find(
        (p) =>
          (p.name || '').toLowerCase().includes(target) ||
          (p.tags || []).some((t) => String(t).toLowerCase().includes(target))
      );
      if (found) return found;
      return { name: entry.canonical, kannadaName: entry.keywords[0] };
    }
  }

  // 3. Token partial match
  for (const prod of products) {
    const words = (prod.name || '').toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    if (words.some((w) => lower.includes(w))) {
      return prod;
    }
  }

  return null;
}

function matchCustomer(text, customers = []) {
  const lower = text.toLowerCase();
  for (const c of customers) {
    const firstName = (c.name || '').split(' ')[0].toLowerCase();
    if (
      (c.name && lower.includes(c.name.toLowerCase())) ||
      (firstName.length >= 3 && lower.includes(firstName)) ||
      (c.kannadaName && text.includes(c.kannadaName))
    ) {
      return c;
    }
  }
  return null;
}

function parseVoiceCommand(transcript, { products = [], customers = [] } = {}) {
  const raw = String(transcript || '').trim();
  const lower = raw.toLowerCase();
  const language = detectLanguage(raw);

  const matchedProduct = matchProductFromCatalog(raw, products);
  const matchedCustomer = matchCustomer(raw, customers);
  const quantity = extractQuantity(raw);
  const amount = extractRupeeAmount(raw);

  // Intent rules ordered by specificity
  const isSalesReport =
    /ಮಾರಾಟ|ವರದಿ|ಗಳಿಕೆ|ಕಲೆಕ್ಷನ್|ಆದಾಯ|sales|revenue|report|earnings|today.*collection|collection/i.test(raw);
  const isRouteOptimize =
    /ರೂಟ್|ದಾರಿ|ಡೆಲಿವರಿ ಮಾರ್ಗ|ಆಪ್ಟಿಮೈಜ್|route|optimize|delivery path|navigation/i.test(raw);
  const isDemandForecast =
    /ಬೇಡಿಕೆ|ಮುನ್ಸೂಚನೆ|ಎಐ|ai|forecast|demand|predict/i.test(raw);
  const isUdhaarAdd =
    (/(?:ಉದಾರ್|ಉಧಾರ್|ಖಾತಾ|ಸಾಲ|udhaar|udhar|khata|credit)/i.test(raw)) &&
    (amount != null || /ಸೇರಿಸಿ|ಬರೆಯಿರಿ|ನಮೂದಿಸಿ|add|record|give/i.test(raw));
  const isUdhaarCheck =
    /ಉದಾರ್|ಉಧಾರ್|ಖಾತಾ|ಬಾಕಿ|udhaar|udhar|khata|credit|dues|pending payment/i.test(raw);
  const isLowStock =
    /ಕಡಿಮೆ ಸ್ಟಾಕ್|ಖಾಲಿ|ಮುಗಿದ|low stock|out of stock|restock|shortage/i.test(raw);
  const isAddStock =
    (/(?:ಸ್ಟಾಕ್|stock|inventory)/i.test(raw) && /ಸೇರಿಸಿ|ಹೆಚ್ಚಿಸಿ|ಬಂದಿದೆ|add|update|increase|restock/i.test(raw)) &&
    matchedProduct != null;
  const isBillOrOrder =
    (/ಬಿಲ್|ಆರ್ಡರ್|ಮಾರಿ|ಕೊಡಿ|ಪ್ಯಾಕ್|bill|order|sell|checkout|pack/i.test(raw) && matchedProduct != null) ||
    (matchedProduct != null && quantity != null && !/ಸ್ಟಾಕ್|stock/i.test(raw));
  const isCheckStock =
    /ಸ್ಟಾಕ್|ಎಷ್ಟಿದೆ|ಬೆಲೆ|ದರ|ಉತ್ಪನ್ನ|stock|price|rate|how much|available|show product/i.test(raw);

  let intent = 'GENERAL_HELP';
  let confidence = 0.94;

  if (isRouteOptimize) intent = 'OPTIMIZE_ROUTE';
  else if (isDemandForecast) intent = 'DEMAND_FORECAST';
  else if (isUdhaarAdd && amount) intent = 'ADD_UDHAAR';
  else if (isUdhaarCheck) intent = 'SHOW_UDHAAR';
  else if (isAddStock) intent = 'ADD_STOCK';
  else if (isBillOrOrder) intent = 'CREATE_VOICE_ORDER';
  else if (isLowStock) intent = 'LOW_STOCK_REPORT';
  else if (isCheckStock) intent = 'CHECK_STOCK';
  else if (isSalesReport) intent = 'SHOW_SALES';
  else confidence = 0.65;

  return {
    transcript: raw,
    language,
    intent,
    confidence,
    entities: {
      productId: matchedProduct?.id || null,
      productName: matchedProduct?.name || null,
      productKannadaName: matchedProduct?.kannadaName || null,
      quantity: quantity || 1,
      amount: amount || null,
      customerId: matchedCustomer?.id || null,
      customerName: matchedCustomer?.name || null,
    },
  };
}

module.exports = {
  parseVoiceCommand,
  detectLanguage,
};
