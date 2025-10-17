/**
 * Knowledge Base for Ingredient Validation and Normalization
 * Contains common vitamins, minerals, and their properties
 */

export interface IngredientInfo {
  canonicalName: string;
  aliases: string[];
  commonUnits: string[];
  chemicalForms: string[];
  typicalRanges: {
    prenatal?: { min: number; max: number; unit: string };
    adult?: { min: number; max: number; unit: string };
  };
  conversionFactors?: { [unit: string]: number }; // to base unit
  pregnancyRecommendation?: string;
  warnings?: string[];
}

export const INGREDIENT_DATABASE: { [key: string]: IngredientInfo } = {
  'vitamin-a': {
    canonicalName: 'Vitamin A',
    aliases: ['vitamin a', 'retinol', 'beta-carotene', 'beta carotene', 'retinyl palmitate', 'retinyl acetate'],
    commonUnits: ['mcg', 'μg', 'IU', 'mg'],
    chemicalForms: ['as Retinol', 'as Beta-Carotene', 'as Retinyl Palmitate'],
    typicalRanges: {
      prenatal: { min: 700, max: 3000, unit: 'mcg' },
      adult: { min: 700, max: 3000, unit: 'mcg' },
    },
    conversionFactors: { 'IU': 0.3, 'mcg': 1, 'mg': 1000 },
    pregnancyRecommendation: '770 mcg (2,565 IU) daily',
    warnings: ['High doses (>3000 mcg) may be harmful during pregnancy'],
  },
  
  'vitamin-c': {
    canonicalName: 'Vitamin C',
    aliases: ['vitamin c', 'ascorbic acid', 'ascorbate', 'l-ascorbic acid'],
    commonUnits: ['mg', 'g'],
    chemicalForms: ['as Ascorbic Acid', 'as Sodium Ascorbate', 'as Calcium Ascorbate'],
    typicalRanges: {
      prenatal: { min: 80, max: 2000, unit: 'mg' },
      adult: { min: 75, max: 2000, unit: 'mg' },
    },
    conversionFactors: { 'mg': 1, 'g': 1000 },
    pregnancyRecommendation: '85 mg daily',
  },
  
  'vitamin-d': {
    canonicalName: 'Vitamin D3',
    aliases: ['vitamin d', 'vitamin d3', 'vitamin d2', 'cholecalciferol', 'ergocalciferol', 'calciferol'],
    commonUnits: ['IU', 'mcg', 'μg'],
    chemicalForms: ['as Cholecalciferol', 'as Ergocalciferol'],
    typicalRanges: {
      prenatal: { min: 400, max: 4000, unit: 'IU' },
      adult: { min: 600, max: 4000, unit: 'IU' },
    },
    conversionFactors: { 'IU': 1, 'mcg': 40, 'μg': 40 },
    pregnancyRecommendation: '600 IU (15 mcg) daily',
  },
  
  'vitamin-e': {
    canonicalName: 'Vitamin E',
    aliases: ['vitamin e', 'tocopherol', 'alpha-tocopherol', 'tocopheryl', 'd-alpha-tocopherol'],
    commonUnits: ['mg', 'IU'],
    chemicalForms: ['as d-alpha-Tocopherol', 'as dl-alpha-Tocopherol', 'as Tocopheryl Acetate'],
    typicalRanges: {
      prenatal: { min: 15, max: 1000, unit: 'mg' },
      adult: { min: 15, max: 1000, unit: 'mg' },
    },
    conversionFactors: { 'mg': 1, 'IU': 0.67 },
    pregnancyRecommendation: '15 mg daily',
  },
  
  'vitamin-k': {
    canonicalName: 'Vitamin K',
    aliases: ['vitamin k', 'vitamin k1', 'vitamin k2', 'phylloquinone', 'menaquinone'],
    commonUnits: ['mcg', 'μg'],
    chemicalForms: ['as Phylloquinone', 'as Menaquinone'],
    typicalRanges: {
      prenatal: { min: 75, max: 120, unit: 'mcg' },
      adult: { min: 90, max: 120, unit: 'mcg' },
    },
    pregnancyRecommendation: '90 mcg daily',
  },
  
  'vitamin-b1': {
    canonicalName: 'Thiamin (Vitamin B1)',
    aliases: ['thiamin', 'thiamine', 'vitamin b1', 'b1'],
    commonUnits: ['mg'],
    chemicalForms: ['as Thiamine Hydrochloride', 'as Thiamine Mononitrate'],
    typicalRanges: {
      prenatal: { min: 1.4, max: 100, unit: 'mg' },
      adult: { min: 1.1, max: 100, unit: 'mg' },
    },
    pregnancyRecommendation: '1.4 mg daily',
  },
  
  'vitamin-b2': {
    canonicalName: 'Riboflavin (Vitamin B2)',
    aliases: ['riboflavin', 'vitamin b2', 'b2'],
    commonUnits: ['mg'],
    chemicalForms: ['as Riboflavin'],
    typicalRanges: {
      prenatal: { min: 1.4, max: 100, unit: 'mg' },
      adult: { min: 1.1, max: 100, unit: 'mg' },
    },
    pregnancyRecommendation: '1.4 mg daily',
  },
  
  'vitamin-b3': {
    canonicalName: 'Niacin (Vitamin B3)',
    aliases: ['niacin', 'vitamin b3', 'b3', 'nicotinic acid', 'niacinamide', 'nicotinamide'],
    commonUnits: ['mg'],
    chemicalForms: ['as Niacinamide', 'as Nicotinic Acid'],
    typicalRanges: {
      prenatal: { min: 18, max: 35, unit: 'mg' },
      adult: { min: 14, max: 35, unit: 'mg' },
    },
    pregnancyRecommendation: '18 mg daily',
  },
  
  'vitamin-b6': {
    canonicalName: 'Vitamin B6',
    aliases: ['vitamin b6', 'b6', 'pyridoxine', 'pyridoxal', 'pyridoxamine'],
    commonUnits: ['mg'],
    chemicalForms: ['as Pyridoxine Hydrochloride', 'as Pyridoxal-5-Phosphate'],
    typicalRanges: {
      prenatal: { min: 1.9, max: 100, unit: 'mg' },
      adult: { min: 1.3, max: 100, unit: 'mg' },
    },
    pregnancyRecommendation: '1.9 mg daily',
  },
  
  'vitamin-b12': {
    canonicalName: 'Vitamin B12',
    aliases: ['vitamin b12', 'b12', 'cobalamin', 'cyanocobalamin', 'methylcobalamin'],
    commonUnits: ['mcg', 'μg'],
    chemicalForms: ['as Cyanocobalamin', 'as Methylcobalamin'],
    typicalRanges: {
      prenatal: { min: 2.6, max: 1000, unit: 'mcg' },
      adult: { min: 2.4, max: 1000, unit: 'mcg' },
    },
    pregnancyRecommendation: '2.6 mcg daily',
  },
  
  'folic-acid': {
    canonicalName: 'Folic Acid',
    aliases: ['folic acid', 'folate', 'vitamin b9', 'b9', 'methylfolate', '5-mthf', 'l-methylfolate'],
    commonUnits: ['mcg', 'μg', 'mg'],
    chemicalForms: ['as Folic Acid', 'as L-Methylfolate', 'as 5-MTHF'],
    typicalRanges: {
      prenatal: { min: 400, max: 1000, unit: 'mcg' },
      adult: { min: 400, max: 1000, unit: 'mcg' },
    },
    conversionFactors: { 'mcg': 1, 'mg': 1000 },
    pregnancyRecommendation: '600 mcg daily (critical for neural tube development)',
    warnings: ['Essential during pregnancy - prevents neural tube defects'],
  },
  
  'biotin': {
    canonicalName: 'Biotin',
    aliases: ['biotin', 'vitamin b7', 'vitamin h', 'b7'],
    commonUnits: ['mcg', 'μg'],
    chemicalForms: ['as d-Biotin'],
    typicalRanges: {
      prenatal: { min: 30, max: 10000, unit: 'mcg' },
      adult: { min: 30, max: 10000, unit: 'mcg' },
    },
    pregnancyRecommendation: '30 mcg daily',
  },
  
  'pantothenic-acid': {
    canonicalName: 'Pantothenic Acid',
    aliases: ['pantothenic acid', 'vitamin b5', 'b5', 'pantothenate'],
    commonUnits: ['mg'],
    chemicalForms: ['as Calcium Pantothenate', 'as Pantothenic Acid'],
    typicalRanges: {
      prenatal: { min: 6, max: 100, unit: 'mg' },
      adult: { min: 5, max: 100, unit: 'mg' },
    },
    pregnancyRecommendation: '6 mg daily',
  },
  
  'calcium': {
    canonicalName: 'Calcium',
    aliases: ['calcium', 'ca'],
    commonUnits: ['mg', 'g'],
    chemicalForms: ['as Calcium Carbonate', 'as Calcium Citrate', 'as Calcium Phosphate'],
    typicalRanges: {
      prenatal: { min: 1000, max: 2500, unit: 'mg' },
      adult: { min: 1000, max: 2500, unit: 'mg' },
    },
    conversionFactors: { 'mg': 1, 'g': 1000 },
    pregnancyRecommendation: '1000-1300 mg daily',
  },
  
  'iron': {
    canonicalName: 'Iron',
    aliases: ['iron', 'fe'],
    commonUnits: ['mg'],
    chemicalForms: ['as Ferrous Sulfate', 'as Ferrous Fumarate', 'as Ferrous Gluconate', 'as Ferric Iron'],
    typicalRanges: {
      prenatal: { min: 27, max: 45, unit: 'mg' },
      adult: { min: 8, max: 45, unit: 'mg' },
    },
    pregnancyRecommendation: '27 mg daily',
    warnings: ['May cause constipation', 'Take with vitamin C for better absorption'],
  },
  
  'magnesium': {
    canonicalName: 'Magnesium',
    aliases: ['magnesium', 'mg'],
    commonUnits: ['mg', 'g'],
    chemicalForms: ['as Magnesium Oxide', 'as Magnesium Citrate', 'as Magnesium Glycinate'],
    typicalRanges: {
      prenatal: { min: 350, max: 400, unit: 'mg' },
      adult: { min: 310, max: 420, unit: 'mg' },
    },
    pregnancyRecommendation: '350-400 mg daily',
  },
  
  'zinc': {
    canonicalName: 'Zinc',
    aliases: ['zinc', 'zn'],
    commonUnits: ['mg'],
    chemicalForms: ['as Zinc Oxide', 'as Zinc Sulfate', 'as Zinc Gluconate'],
    typicalRanges: {
      prenatal: { min: 11, max: 40, unit: 'mg' },
      adult: { min: 8, max: 40, unit: 'mg' },
    },
    pregnancyRecommendation: '11 mg daily',
  },
  
  'iodine': {
    canonicalName: 'Iodine',
    aliases: ['iodine', 'i'],
    commonUnits: ['mcg', 'μg'],
    chemicalForms: ['as Potassium Iodide', 'as Sodium Iodide'],
    typicalRanges: {
      prenatal: { min: 220, max: 1100, unit: 'mcg' },
      adult: { min: 150, max: 1100, unit: 'mcg' },
    },
    pregnancyRecommendation: '220 mcg daily (critical for baby brain development)',
  },
  
  'dha': {
    canonicalName: 'DHA (Docosahexaenoic Acid)',
    aliases: ['dha', 'docosahexaenoic acid', 'omega-3', 'omega 3', 'fish oil'],
    commonUnits: ['mg', 'g'],
    chemicalForms: ['from Fish Oil', 'from Algal Oil'],
    typicalRanges: {
      prenatal: { min: 200, max: 1000, unit: 'mg' },
      adult: { min: 250, max: 1000, unit: 'mg' },
    },
    pregnancyRecommendation: '200-300 mg daily (supports baby brain/eye development)',
  },
  
  'epa': {
    canonicalName: 'EPA (Eicosapentaenoic Acid)',
    aliases: ['epa', 'eicosapentaenoic acid', 'omega-3'],
    commonUnits: ['mg', 'g'],
    chemicalForms: ['from Fish Oil', 'from Algal Oil'],
    typicalRanges: {
      prenatal: { min: 100, max: 500, unit: 'mg' },
      adult: { min: 250, max: 1000, unit: 'mg' },
    },
  },
  
  'choline': {
    canonicalName: 'Choline',
    aliases: ['choline', 'choline bitartrate'],
    commonUnits: ['mg'],
    chemicalForms: ['as Choline Bitartrate', 'as Phosphatidylcholine'],
    typicalRanges: {
      prenatal: { min: 450, max: 550, unit: 'mg' },
      adult: { min: 425, max: 550, unit: 'mg' },
    },
    pregnancyRecommendation: '450 mg daily',
  },
};

/**
 * Find ingredient info by name (fuzzy matching)
 */
export function findIngredient(name: string): IngredientInfo | null {
  const searchName = name.toLowerCase().trim();
  
  for (const [key, info] of Object.entries(INGREDIENT_DATABASE)) {
    if (info.canonicalName.toLowerCase() === searchName) {
      return info;
    }
    
    if (info.aliases.some(alias => alias === searchName || searchName.includes(alias) || alias.includes(searchName))) {
      return info;
    }
  }
  
  return null;
}

/**
 * Normalize ingredient name to canonical form
 */
export function normalizeIngredientName(name: string): string {
  const info = findIngredient(name);
  return info ? info.canonicalName : name;
}

/**
 * Validate if amount is reasonable for the ingredient
 */
export function validateIngredientAmount(
  name: string,
  amount: number,
  unit: string,
  category: 'prenatal' | 'adult' = 'prenatal'
): { valid: boolean; warning?: string } {
  const info = findIngredient(name);
  if (!info) {
    return { valid: true }; // Unknown ingredient, can't validate
  }
  
  const range = info.typicalRanges[category];
  if (!range || range.unit !== unit) {
    return { valid: true }; // Can't validate if units don't match
  }
  
  if (amount < range.min) {
    return {
      valid: true,
      warning: `${name}: ${amount}${unit} is below typical range (${range.min}-${range.max}${unit})`,
    };
  }
  
  if (amount > range.max) {
    return {
      valid: false,
      warning: `${name}: ${amount}${unit} exceeds safe upper limit (${range.max}${unit})`,
    };
  }
  
  return { valid: true };
}

/**
 * Get all warnings for an ingredient
 */
export function getIngredientWarnings(name: string): string[] {
  const info = findIngredient(name);
  return info?.warnings || [];
}

/**
 * Check if unit is valid for ingredient
 */
export function isValidUnit(name: string, unit: string): boolean {
  const info = findIngredient(name);
  if (!info) return true; // Unknown ingredient
  
  return info.commonUnits.includes(unit);
}

