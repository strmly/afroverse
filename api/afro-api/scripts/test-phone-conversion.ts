/**
 * Test Phone Number Conversion
 * 
 * Tests South African phone number normalization:
 * - 0821234567 → +27821234567
 * - +27821234567 → +27821234567
 * - 27821234567 → +27821234567
 */

require('dotenv').config();

import {
  normalizePhoneNumber,
  validatePhoneNumber,
} from '../src/utils/phone';

console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                       ║');
console.log('║           🧪 Testing South African Phone Number Conversion 🧪         ║');
console.log('║                                                                       ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

const testCases = [
  {
    input: '0821234567',
    expected: '+27821234567',
    description: 'SA local format (0 + 9 digits)',
  },
  {
    input: '0721234567',
    expected: '+27721234567',
    description: 'SA local format (different prefix)',
  },
  {
    input: '0831234567',
    expected: '+27831234567',
    description: 'SA local format (Telkom)',
  },
  {
    input: '+27821234567',
    expected: '+27821234567',
    description: 'Already in international format',
  },
  {
    input: '27821234567',
    expected: '+27821234567',
    description: 'International format without +',
  },
  {
    input: '+27 82 123 4567',
    expected: '+27821234567',
    description: 'With spaces',
  },
  {
    input: '082-123-4567',
    expected: '+27821234567',
    description: 'With dashes',
  },
  {
    input: '082 123 4567',
    expected: '+27821234567',
    description: 'With spaces (local)',
  },
];

let passed = 0;
let failed = 0;

console.log('Testing Phone Number Normalization:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const testCase of testCases) {
  try {
    const normalized = normalizePhoneNumber(testCase.input);
    const isValid = normalized === testCase.expected;
    
    if (isValid) {
      console.log(`✅ PASS: ${testCase.description}`);
      console.log(`   Input:    "${testCase.input}"`);
      console.log(`   Output:   "${normalized}"`);
      console.log(`   Expected: "${testCase.expected}"\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.description}`);
      console.log(`   Input:    "${testCase.input}"`);
      console.log(`   Output:   "${normalized}"`);
      console.log(`   Expected: "${testCase.expected}"\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failed++;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Testing Phone Number Validation:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const validationTests = [
  '0821234567',
  '+27821234567',
  '082 123 4567',
];

for (const input of validationTests) {
  const result = validatePhoneNumber(input, true);
  
  if (result.valid) {
    console.log(`✅ VALID: "${input}"`);
    console.log(`   Normalized: ${result.normalized}`);
    console.log(`   Country:    ${result.country}`);
    console.log(`   Mobile:     ${result.isMobile}\n`);
  } else {
    console.log(`❌ INVALID: "${input}"`);
    console.log(`   Error: ${result.error}\n`);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📊 Summary:\n');
console.log(`   Passed: ${passed}/${testCases.length}`);
console.log(`   Failed: ${failed}/${testCases.length}\n`);

if (failed === 0) {
  console.log('✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!\n');
  process.exit(1);
}



