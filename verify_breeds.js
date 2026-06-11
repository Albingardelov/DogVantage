const fs = require('fs');
const content = fs.readFileSync('./src/lib/breeds/registry.ts', 'utf8');

// Check for required slugs
const requiredSlugs = [
  { slug: 'labrador', group: 8, fci: 122 },
  { slug: 'italian_greyhound', group: 9, fci: 200 },
  { slug: 'braque_francais', group: 7, fci: 134 },
  { slug: 'miniature_american_shepherd', group: 1, fci: 357 }
];

console.log('=== VERIFICATION RESULTS ===\n');

// 1. Check BreedEntry interface
if (content.includes('export interface BreedEntry') &&
    content.includes('slug: string') &&
    content.includes('nameSv: string') &&
    content.includes('nameEn: string') &&
    content.includes('fciGroup: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10') &&
    content.includes('fciNumber: number')) {
  console.log('✅ BreedEntry interface: All required fields present with correct types');
} else {
  console.log('❌ BreedEntry interface: Missing or incorrect fields');
}

// 2. Check for required slugs
console.log('\n=== Required Legacy Slugs ===');
requiredSlugs.forEach(req => {
  const regex = new RegExp(`{ slug: '${req.slug}'.*?fciGroup: ${req.group}, fciNumber: ${req.fci}`, 's');
  if (regex.test(content)) {
    console.log(`✅ ${req.slug} (group ${req.group}, FCI ${req.fci})`);
  } else {
    console.log(`❌ ${req.slug} - NOT FOUND OR INCORRECT VALUES`);
  }
});

// 3. Check for all 10 groups
console.log('\n=== FCI Groups Coverage ===');
const groups = new Set();
const lines = content.split('\n');
lines.forEach(line => {
  const match = line.match(/fciGroup: (\d+)/);
  if (match) {
    groups.add(parseInt(match[1]));
  }
});
const sortedGroups = Array.from(groups).sort((a, b) => a - b);
console.log(`Found groups: ${sortedGroups.join(', ')}`);
console.log(sortedGroups.length === 10 && sortedGroups[0] === 1 && sortedGroups[9] === 10 
  ? '✅ All 10 FCI groups (1-10) represented'
  : '❌ Missing some FCI groups');

// 4. Check for function exports
const hasIsValidBreed = content.includes('export function isValidBreed');
const hasGetBreedEntry = content.includes('export function getBreedEntry');
console.log('\n=== Function Exports ===');
console.log(hasIsValidBreed ? '✅ isValidBreed exported' : '❌ isValidBreed NOT exported');
console.log(hasGetBreedEntry ? '✅ getBreedEntry exported' : '❌ getBreedEntry NOT exported');

// 5. Count breeds
const breedCount = (content.match(/{ slug: '/g) || []).length;
console.log(`\n=== Breed Count ===`);
console.log(`Total breeds: ${breedCount} (spec requires ~100)`);
console.log(breedCount >= 100 ? '✅ Meets minimum count' : '❌ Below 100 breeds');

// 6. Check for duplicate slugs
console.log('\n=== Duplicate Slug Check ===');
const slugMatches = content.match(/slug: '([^']+)'/g);
const slugs = slugMatches.map(m => m.replace("slug: '", '').replace("'", ''));
const duplicates = slugs.filter((v, i) => slugs.indexOf(v) !== i);
if (duplicates.length === 0) {
  console.log('✅ No duplicate slugs found');
} else {
  console.log('❌ Duplicate slugs found:', [...new Set(duplicates)].join(', '));
}

console.log('\n=== TYPE CHECKING ===');
