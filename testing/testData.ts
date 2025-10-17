/**
 * Test data for ingredient identification
 * Contains vitamin label images and their expected ingredients
 */

export interface TestCase {
  id: string;
  name: string;
  imageUrl: string;
  expectedIngredients: string[];
  productName?: string;
  notes?: string;
}

/**
 * Curated test cases with vitamin label images
 * These are publicly available images of vitamin labels
 */
export const testCases: TestCase[] = [
  {
    id: 'prenatal_1',
    name: 'Nature Made Prenatal Multi + DHA',
    imageUrl: 'https://images.vitaminimages.com/cdn/shop/products/nature-made-prenatal-multi-dha-60-softgels_1024x1024.jpg',
    expectedIngredients: [
      'Vitamin A',
      'Vitamin C',
      'Vitamin D3',
      'Vitamin E',
      'Vitamin B6',
      'Folic Acid',
      'Vitamin B12',
      'Iron',
      'Zinc',
      'DHA',
    ],
    productName: 'Nature Made Prenatal Multi + DHA',
    notes: 'Common prenatal vitamin with DHA',
  },
  {
    id: 'prenatal_2',
    name: 'One A Day Prenatal',
    imageUrl: 'https://www.oneaday.com/sites/g/files/jcdfhc221/files/styles/brand_product_image_desktop_2x/public/2021-10/PreNatal-1_0.png',
    expectedIngredients: [
      'Vitamin A',
      'Vitamin C',
      'Vitamin D',
      'Vitamin E',
      'Thiamin',
      'Riboflavin',
      'Niacin',
      'Vitamin B6',
      'Folic Acid',
      'Vitamin B12',
      'Calcium',
      'Iron',
      'Zinc',
    ],
    productName: 'One A Day Prenatal',
    notes: 'Popular prenatal multivitamin',
  },
  {
    id: 'vitamin_d3_1',
    name: 'Vitamin D3 2000 IU',
    imageUrl: 'https://www.naturesplus.com/images/products/large/1253.jpg',
    expectedIngredients: ['Vitamin D3', 'Cholecalciferol'],
    productName: 'Vitamin D3',
    notes: 'Simple vitamin D supplement',
  },
  {
    id: 'calcium_1',
    name: 'Calcium with Vitamin D',
    imageUrl: 'https://www.vitacost.com/Images/Products/1000/Vitacost/Vitacost-Calcium-030306070013.jpg',
    expectedIngredients: ['Calcium', 'Vitamin D', 'Calcium Carbonate'],
    productName: 'Calcium + Vitamin D',
    notes: 'Calcium supplement with vitamin D',
  },
  {
    id: 'iron_1',
    name: 'Ferrous Sulfate Iron',
    imageUrl: 'https://www.naturesplus.com/images/products/large/1436.jpg',
    expectedIngredients: ['Iron', 'Ferrous Sulfate'],
    productName: 'Iron Supplement',
    notes: 'Iron supplement for pregnancy',
  },
  {
    id: 'folic_acid_1',
    name: 'Folic Acid 800 mcg',
    imageUrl: 'https://www.naturesplus.com/images/products/large/1437.jpg',
    expectedIngredients: ['Folic Acid', 'Folate'],
    productName: 'Folic Acid',
    notes: 'Essential for pregnancy',
  },
  {
    id: 'omega_3_1',
    name: 'Omega-3 Fish Oil with DHA',
    imageUrl: 'https://www.naturesplus.com/images/products/large/1502.jpg',
    expectedIngredients: ['DHA', 'EPA', 'Omega-3', 'Fish Oil'],
    productName: 'Omega-3 DHA',
    notes: 'Omega-3 supplement for brain development',
  },
  {
    id: 'multivitamin_1',
    name: 'Women\'s Multivitamin',
    imageUrl: 'https://www.vitacost.com/Images/Products/1000/Vitacost/Vitacost-Womens-Multivitamin-030306001398.jpg',
    expectedIngredients: [
      'Vitamin A',
      'Vitamin C',
      'Vitamin D',
      'Vitamin E',
      'Vitamin K',
      'Thiamin',
      'Riboflavin',
      'Niacin',
      'Vitamin B6',
      'Folic Acid',
      'Vitamin B12',
      'Biotin',
      'Pantothenic Acid',
      'Calcium',
      'Iron',
      'Magnesium',
      'Zinc',
    ],
    productName: 'Women\'s Multivitamin',
    notes: 'Comprehensive women\'s multivitamin',
  },
];

/**
 * Local test images (these would be stored in the assets/test-images folder)
 */
export const localTestImages: TestCase[] = [
  {
    id: 'local_prenatal_1',
    name: 'Local Prenatal Test Image 1',
    imageUrl: './assets/test-images/prenatal_1.jpg',
    expectedIngredients: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Folic Acid', 'Iron'],
    notes: 'Local test image',
  },
];

