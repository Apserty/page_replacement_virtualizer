/**
 * Automated Test Suite for Page Replacement Algorithms
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 * 
 * Run with: node tests/algorithms.test.js
 */

import { simulateFIFO, simulateLRU, simulateOptimal, runPageReplacement } from '../js/algorithms.js';
import { parseReferenceString } from '../js/app.js';

// Minimal Test Runner
let passed = 0;
let failed = 0;
let pending = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function test(description, fn, isPending = false) {
  if (isPending) {
    console.log(`  [-] PENDING (Phase 2): ${description}`);
    pending++;
    return;
  }
  try {
    fn();
    console.log(`  [✓] PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [✗] FAIL: ${description}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

function describe(suiteName, fn) {
  console.log(`\n--- Test Suite: ${suiteName} ---`);
  fn();
}

// 1. Module Structure and Interface Tests
describe('Phase 1 Interface & Module Structure', () => {
  test('simulateFIFO should be exported as a function', () => {
    assert(typeof simulateFIFO === 'function', 'simulateFIFO is not a function');
  });

  test('simulateLRU should be exported as a function', () => {
    assert(typeof simulateLRU === 'function', 'simulateLRU is not a function');
  });

  test('simulateOptimal should be exported as a function', () => {
    assert(typeof simulateOptimal === 'function', 'simulateOptimal is not a function');
  });

  test('runPageReplacement should dispatch known algorithms and validate schema', () => {
    const ref = [7, 0, 1];
    const res = runPageReplacement('FIFO', ref, 3);
    assert(res.algorithm === 'FIFO', 'Algorithm property mismatch');
    assert(res.frameCount === 3, 'Frame count mismatch');
    assert(Array.isArray(res.referenceString), 'referenceString is not array');
    assert(Array.isArray(res.steps), 'steps is not array');
  });

  test('runPageReplacement should throw for unsupported algorithm', () => {
    let threw = false;
    try {
      runPageReplacement('UNKNOWN_ALGO', [1, 2], 3);
    } catch {
      threw = true;
    }
    assert(threw, 'Did not throw for unsupported algorithm');
  });
});

// 2. Input Validation Tests
describe('Input Parser & Validation', () => {
  test('parseReferenceString should parse comma-separated string', () => {
    const result = parseReferenceString('7, 0, 1, 2, 0, 3');
    assert(result.length === 6, 'Parsed length incorrect');
    assert(result[0] === 7 && result[1] === 0 && result[5] === 3, 'Token values incorrect');
  });

  test('parseReferenceString should parse space-separated string', () => {
    const result = parseReferenceString('7 0 1 2');
    assert(result.length === 4, 'Parsed length incorrect');
    assert(result[3] === 2, 'Token value incorrect');
  });

  test('parseReferenceString should reject empty or invalid inputs', () => {
    let threwEmpty = false;
    try {
      parseReferenceString('');
    } catch {
      threwEmpty = true;
    }
    assert(threwEmpty, 'Empty string did not throw error');

    let threwNegative = false;
    try {
      parseReferenceString('1, -2, 3');
    } catch {
      threwNegative = true;
    }
    assert(threwNegative, 'Negative number did not throw error');
  });
});

// 3. Benchmark Test Cases for Algorithm Engine
describe('Benchmark Test Cases (Reference: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2 with 3 frames)', () => {
  const benchmarkRefString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
  const frameCount = 3;

  test('FIFO Page Replacement on Benchmark Reference String', () => {
    const result = simulateFIFO(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 10, `Expected 10 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 3, `Expected 3 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
  });

  test('LRU Page Replacement on Benchmark Reference String', () => {
    const result = simulateLRU(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 9, `Expected 9 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 4, `Expected 4 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
  });

  test('Optimal Page Replacement on Benchmark Reference String', () => {
    const result = simulateOptimal(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 7, `Expected 7 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 6, `Expected 6 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
  });
});

// Summary
console.log('\n=======================================');
console.log(`Test Execution Summary:`);
console.log(`Passed: ${passed} | Failed: ${failed} | Pending: ${pending}`);
console.log('=======================================\n');

if (failed > 0) {
  process.exit(1);
}
