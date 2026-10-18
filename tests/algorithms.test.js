/**
 * Automated Test Suite for Page Replacement Algorithms & Audio Tutor
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 * 
 * Run with: node tests/algorithms.test.js
 */

import { simulateFIFO, simulateLRU, simulateOptimal, runPageReplacement } from '../js/algorithms.js';
import { generateStepExplanation, describeFrames } from '../js/explanations.js';
import { AudioTutor } from '../js/audioTutor.js';
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
    console.log(`  [-] PENDING: ${description}`);
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

// 3. Benchmark Test Cases with Two Decimal Places Precision
describe('Benchmark Test Cases (Reference: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2 with 3 frames)', () => {
  const benchmarkRefString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
  const frameCount = 3;

  test('FIFO Page Replacement on Benchmark Reference String (2 decimal precision)', () => {
    const result = simulateFIFO(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 10, `Expected 10 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 3, `Expected 3 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
    assert(result.hitRatio === 23.08, `Expected hitRatio 23.08%, got ${result.hitRatio}%`);
    assert(result.faultRatio === 76.92, `Expected faultRatio 76.92%, got ${result.faultRatio}%`);
  });

  test('LRU Page Replacement on Benchmark Reference String (2 decimal precision)', () => {
    const result = simulateLRU(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 9, `Expected 9 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 4, `Expected 4 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
    assert(result.hitRatio === 30.77, `Expected hitRatio 30.77%, got ${result.hitRatio}%`);
    assert(result.faultRatio === 69.23, `Expected faultRatio 69.23%, got ${result.faultRatio}%`);
  });

  test('Optimal Page Replacement on Benchmark Reference String (2 decimal precision)', () => {
    const result = simulateOptimal(benchmarkRefString, frameCount);
    assert(result.totalRequests === 13, 'Total requests mismatch');
    assert(result.totalFaults === 7, `Expected 7 faults, got ${result.totalFaults}`);
    assert(result.totalHits === 6, `Expected 6 hits, got ${result.totalHits}`);
    assert(result.steps.length === 13, 'Steps length mismatch');
    assert(result.hitRatio === 46.15, `Expected hitRatio 46.15%, got ${result.hitRatio}%`);
    assert(result.faultRatio === 53.85, `Expected faultRatio 53.85%, got ${result.faultRatio}%`);
  });
});

// 4. Hit Immediately After Initial Load Test
describe('Immediate Hit and Initial Load Scenarios', () => {
  test('Page hit immediately following an initial load', () => {
    const ref = [2, 2, 2];
    const res = simulateFIFO(ref, 3);
    assert(res.totalFaults === 1, `Expected 1 fault, got ${res.totalFaults}`);
    assert(res.totalHits === 2, `Expected 2 hits, got ${res.totalHits}`);
    assert(res.steps[0].eventType === 'FAULT_INITIAL', 'Step 0 should be FAULT_INITIAL');
    assert(res.steps[1].eventType === 'HIT', 'Step 1 should be HIT');
    assert(res.steps[2].eventType === 'HIT', 'Step 2 should be HIT');
    assert(res.steps[1].eventTypeTitle === 'PAGE HIT', 'Step 1 title should be PAGE HIT');
  });

  test('Fault when an empty frame is available (no eviction)', () => {
    const ref = [5, 6];
    const res = simulateFIFO(ref, 3);
    assert(res.steps[0].eventType === 'FAULT_INITIAL', 'Step 0 should be initial fault');
    assert(res.steps[1].eventType === 'FAULT_INITIAL', 'Step 1 should be initial fault');
    assert(res.steps[1].victimPage === null, 'victimPage must be null when empty frame is filled');
    assert(res.steps[1].eventTypeTitle === 'PAGE FAULT — EMPTY FRAME AVAILABLE', 'Title should specify empty frame');
  });

  test('Fault when every frame is occupied (replacement occurs)', () => {
    const ref = [1, 2, 3, 4];
    const res = simulateFIFO(ref, 3);
    assert(res.steps[3].eventType === 'FAULT_REPLACE', 'Step 3 must be FAULT_REPLACE');
    assert(res.steps[3].victimPage === 1, `Oldest page 1 must be evicted, got ${res.steps[3].victimPage}`);
    assert(res.steps[3].victimFrameIndex === 0, 'Frame 0 must be replaced in FIFO order');
    assert(res.steps[3].eventTypeTitle === 'PAGE FAULT — PAGE REPLACEMENT REQUIRED', 'Title should specify replacement required');
  });
});

// 5. New 8-Section Logical Structure & Separation of Display vs Audio
describe('8-Section Logical Structure & Audio Narration Separation', () => {
  test('FIFO replacement step implements all sections A through H', () => {
    const ref = [7, 0, 1, 2];
    const res = simulateFIFO(ref, 3);
    const step4 = res.steps[3];

    // A. Step Title
    assert(step4.stepTitle === 'Step 4 of 4 — Page 2', `Step title mismatch: ${step4.stepTitle}`);
    assert(step4.eventTypeTitle === 'PAGE FAULT — PAGE REPLACEMENT REQUIRED', `Event title mismatch: ${step4.eventTypeTitle}`);

    // B. What Happened?
    assert(step4.sections.whatHappened.includes('The CPU requested page 2'), 'Missing CPU request in whatHappened');
    assert(step4.sections.whatHappened.includes('page fault'), 'Missing page fault in whatHappened');

    // C. Current Memory State
    assert(step4.sections.currentMemory.includes('Before this request, Frame 0 contains page 7, Frame 1 contains page 0, and Frame 2 contains page 1'), 'currentMemory does not match natural frame format');

    // D. Why Did This Happen?
    assert(step4.sections.whyDidThisHappen.includes('Page 2 was not found in any frame'), 'whyDidThisHappen missing cause');
    assert(step4.sections.whyDidThisHappen.includes('all 3 physical frames are currently occupied'), 'whyDidThisHappen missing frames full');

    // E. Algorithm Decision
    assert(step4.sections.algoDecision.includes('First-In, First-Out (FIFO)'), 'algoDecision missing FIFO name');
    assert(step4.sections.algoDecision.includes('Page 7 in Frame 0 was loaded at Step 1'), 'algoDecision missing arrival step');

    // F. Action Taken
    assert(step4.sections.actionTaken.includes('Page 7 was removed from Frame 0, and page 2 was loaded into Frame 0'), 'actionTaken missing removal and load');

    // G. Updated Memory
    assert(step4.sections.updatedMemory.includes('After this request, Frame 0 contains page 2, Frame 1 contains page 0, and Frame 2 contains page 1'), 'updatedMemory does not match natural frame format');

    // H. Running Statistics
    assert(step4.sections.runningStats.includes('Running statistics: Total requests: 4, Page hits: 0 (0.00%), Page faults: 4 (100.00%)'), 'runningStats missing 2-decimal percentages');

    // Audio Narration verification: natural spoken words without HTML tags
    assert(step4.audioNarration, 'Missing audioNarration');
    assert(!step4.audioNarration.includes('<div') && !step4.audioNarration.includes('</div>'), 'audioNarration should not contain HTML tags');
    assert(step4.audioNarration.startsWith('Step 4, Page 2, It is Page Fault Because Page Replacement is required.'), 'audioNarration should start with structured audioIntro');
    assert(!step4.displayHtml.includes('Running Statistics'), 'displayHtml should not contain Running Statistics section');
    assert(!step4.audioNarration.includes('Running statistics'), 'audioNarration should not contain Running statistics');
  });

  test('describeFrames formats empty and partially filled frames naturally', () => {
    const f1 = [7, null, 1];
    assert(describeFrames(f1) === 'Frame 0 contains page 7, Frame 1 is empty, and Frame 2 contains page 1', 'describeFrames natural formatting mismatch');

    const f2 = [null, null, null];
    assert(describeFrames(f2) === 'all frames are empty', 'all null frames should say all frames are empty');
  });
});

// 6. Audio Tutor Default Voice Priority & Fallback Safety
describe('Audio Tutor Default Voice Priority & Safety', () => {
  test('findBestEnglishVoice prioritizes Microsoft Neerja Online (Natural) (en-IN), then other en-IN, then natural English', () => {
    const tutor = new AudioTutor();

    const mockVoicesWithNeerja = [
      { name: 'Microsoft David - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' },
      { name: 'Microsoft Mark - English (United States)', lang: 'en-US' }
    ];
    const neerjaIndex = tutor.findBestEnglishVoice(mockVoicesWithNeerja);
    assert(neerjaIndex === 1, `Expected Neerja voice index 1, got ${neerjaIndex}`);

    const mockVoices = [
      { name: 'David', lang: 'en-US' },
      { name: 'Rishi', lang: 'en-IN' },
      { name: 'George', lang: 'en-GB' }
    ];

    const bestIndex = tutor.findBestEnglishVoice(mockVoices);
    assert(bestIndex === 1, `Expected en-IN voice index 1, got ${bestIndex}`);

    const mockVoicesNoIn = [
      { name: 'Standard Voice', lang: 'en-US' },
      { name: 'Google Natural English', lang: 'en-US' },
      { name: 'UK Voice', lang: 'en-GB' }
    ];
    const bestNaturalIndex = tutor.findBestEnglishVoice(mockVoicesNoIn);
    assert(bestNaturalIndex === 1, `Expected natural voice index 1, got ${bestNaturalIndex}`);
  });

  test('Default speaking rate is set to 1.0 and pitch to 1.0', () => {
    const tutor = new AudioTutor();
    assert(tutor.rate === 1.0, `Expected default rate 1.0, got ${tutor.rate}`);
    assert(tutor.pitch === 1.0, `Expected default pitch 1.0, got ${tutor.pitch}`);
  });

  test('AudioTutor initializes safely in Node.js environment without crashing', () => {
    const tutor = new AudioTutor();
    assert(tutor.isSupported === false, 'isSupported should be false in Node environment');
    assert(tutor.status === 'unsupported', 'status should be unsupported');
    
    let completed = false;
    tutor.speak('Test explanation', {
      onEnd: () => { completed = true; }
    });
    assert(completed === true, 'speak on unsupported engine should invoke onEnd gracefully');
  });
});

// 7. Deterministic History & Edge Cases
describe('Deterministic History & Edge Cases', () => {
  test('Step history is deterministic across repeated runs', () => {
    const ref = [1, 2, 3, 1, 4, 1, 2];
    const run1 = simulateLRU(ref, 3);
    const run2 = simulateLRU(ref, 3);
    assert(JSON.stringify(run1.steps) === JSON.stringify(run2.steps), 'Simulation results must be strictly deterministic');
  });

  test('Single frame edge case runs correctly', () => {
    const ref = [1, 2, 3];
    const res = simulateFIFO(ref, 1);
    assert(res.totalFaults === 3, 'Single frame must fault on every distinct page');
    assert(res.steps[2].frames[0] === 3, 'Frame 0 must hold page 3');
  });

  test('Repeated requests of same page with larger frame count', () => {
    const ref = [4, 4, 4, 4];
    const res = simulateOptimal(ref, 5);
    assert(res.totalFaults === 1, 'Only first request should fault');
    assert(res.totalHits === 3, 'Remaining 3 requests should hit');
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
