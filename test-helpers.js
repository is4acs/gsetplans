#!/usr/bin/env node
/**
 * Simple test runner for helper functions
 */

console.log('=== Running Helper Tests ===\n');

let passed = 0;
let failed = 0;

// Test parseExcelDate
try {
  const result = parseExcelDate(44927);
  if (result instanceof Date && result.getFullYear() === 2023) {
    console.log('✅ Test 1 PASSED: parseExcelDate with number');
    passed++;
  } else {
    console.log('❌ Test 1 FAILED: parseExcelDate with number');
    failed++;
  }
} catch (err) {
  console.log('❌ Test 1 FAILED:', err);
  failed++;
}

// Test isAbortError
try {
  const result = isAbortError(new Error('abort'));
  if (result === true) {
    console.log('✅ Test 2 PASSED: isAbortError');
    passed++;
  } else {
    console.log('❌ Test 2 FAILED: isAbortError');
    failed++;
  }
} catch (err) {
  console.log('❌ Test 2 FAILED:', err);
  failed++;
}

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
