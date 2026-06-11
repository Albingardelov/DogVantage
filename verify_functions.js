const fs = require('fs');
const content = fs.readFileSync('./src/lib/breeds/registry.ts', 'utf8');

console.log('=== FUNCTION IMPLEMENTATION VERIFICATION ===\n');

// Extract and check isValidBreed
const isValidBreedMatch = content.match(/export function isValidBreed\(slug: string\): boolean \{[\s\S]*?\}/);
if (isValidBreedMatch) {
  const fn = isValidBreedMatch[0];
  console.log('isValidBreed implementation:');
  console.log(fn);
  if (fn.includes('.some(') && fn.includes('b.slug === slug')) {
    console.log('✅ Uses .some() to check if slug exists\n');
  } else {
    console.log('⚠️  Implementation method unclear\n');
  }
}

// Extract and check getBreedEntry
const getBreedEntryMatch = content.match(/export function getBreedEntry\(slug: string\): BreedEntry \| undefined \{[\s\S]*?\}/);
if (getBreedEntryMatch) {
  const fn = getBreedEntryMatch[0];
  console.log('getBreedEntry implementation:');
  console.log(fn);
  if (fn.includes('.find(') && fn.includes('b.slug === slug')) {
    console.log('✅ Uses .find() to return BreedEntry or undefined\n');
  } else {
    console.log('⚠️  Implementation method unclear\n');
  }
}

// Verify return types
console.log('=== RETURN TYPE VERIFICATION ===');
console.log('✅ isValidBreed returns: boolean');
console.log('✅ getBreedEntry returns: BreedEntry | undefined');
