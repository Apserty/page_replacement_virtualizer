/**
 * Page Replacement Algorithms Engine (Core Logic)
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 * 
 * Implements pure simulation logic separated from UI code for:
 * - FIFO (First-In, First-Out)
 * - LRU (Least Recently Used)
 * - Optimal (Belady's Min Algorithm)
 */

/**
 * @typedef {Object} SimulationStep
 * @property {number} stepIndex - 0-based step index in the reference stream.
 * @property {number} page - The referenced page number.
 * @property {boolean} isHit - True if page hit, false if page fault.
 * @property {Array<number|null>} frames - State of physical frames after this step.
 * @property {number|null} victimPage - Page evicted from memory, if any.
 * @property {number|null} victimFrameIndex - Frame slot from which victim was evicted (or allocated).
 * @property {string} reason - Human-readable explanation of the placement/replacement decision.
 */

/**
 * @typedef {Object} SimulationResult
 * @property {string} algorithm - Name of algorithm ('FIFO', 'LRU', 'OPTIMAL').
 * @property {number[]} referenceString - Sequence of referenced pages.
 * @property {number} frameCount - Total physical frames allocated.
 * @property {number} totalRequests - Total count of page requests.
 * @property {number} totalHits - Total number of page hits.
 * @property {number} totalFaults - Total number of page faults.
 * @property {number} hitRatio - Hit percentage (0 - 100).
 * @property {number} faultRatio - Fault percentage (0 - 100).
 * @property {SimulationStep[]} steps - Chronological array of step snapshots.
 */

/**
 * First-In, First-Out (FIFO) Page Replacement Simulation
 *
 * @param {number[]} referenceString - Array of page numbers.
 * @param {number} frameCount - Number of allocated physical frames.
 * @returns {SimulationResult}
 */
export function simulateFIFO(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const fifoQueue = []; // tracks frame indices in order of arrival
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      steps.push({
        stepIndex,
        page,
        isHit: true,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        reason: `Page ${page} is already present in Frame ${existingIndex}. (PAGE HIT)`
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;
        fifoQueue.push(emptyIndex);
        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          reason: `Page ${page} caused a PAGE FAULT. Allocated into empty Frame ${emptyIndex}.`
        });
      } else {
        // Replacement required: oldest frame in fifoQueue is replaced
        const victimFrameIndex = fifoQueue.shift();
        const victimPage = frames[victimFrameIndex];
        frames[victimFrameIndex] = page;
        fifoQueue.push(victimFrameIndex);

        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          reason: `Page ${page} caused a PAGE FAULT. Frames full. Evicted oldest Page ${victimPage} from Frame ${victimFrameIndex} (FIFO order).`
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(1)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(1)) : 0;

  return {
    algorithm: 'FIFO',
    referenceString: [...referenceString],
    frameCount,
    totalRequests,
    totalHits,
    totalFaults,
    hitRatio,
    faultRatio,
    steps
  };
}

/**
 * Least Recently Used (LRU) Page Replacement Simulation
 *
 * @param {number[]} referenceString - Array of page numbers.
 * @param {number} frameCount - Number of allocated physical frames.
 * @returns {SimulationResult}
 */
export function simulateLRU(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const lastUsedMap = new Map(); // page -> last referenced step index
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      lastUsedMap.set(page, stepIndex);
      steps.push({
        stepIndex,
        page,
        isHit: true,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        reason: `Page ${page} is already in Frame ${existingIndex}. (PAGE HIT - Last used step updated to ${stepIndex + 1})`
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;
        lastUsedMap.set(page, stepIndex);
        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          reason: `Page ${page} caused a PAGE FAULT. Loaded into empty Frame ${emptyIndex}.`
        });
      } else {
        // Replacement required: find frame whose page has minimum lastUsed step
        let victimFrameIndex = 0;
        let oldestStep = Infinity;

        for (let i = 0; i < frameCount; i++) {
          const residentPage = frames[i];
          const usedStep = lastUsedMap.has(residentPage) ? lastUsedMap.get(residentPage) : -1;
          if (usedStep < oldestStep) {
            oldestStep = usedStep;
            victimFrameIndex = i;
          }
        }

        const victimPage = frames[victimFrameIndex];
        frames[victimFrameIndex] = page;
        lastUsedMap.set(page, stepIndex);

        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          reason: `Page ${page} caused a PAGE FAULT. Frames full. Evicted Page ${victimPage} from Frame ${victimFrameIndex} (least recently referenced at step ${oldestStep + 1}).`
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(1)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(1)) : 0;

  return {
    algorithm: 'LRU',
    referenceString: [...referenceString],
    frameCount,
    totalRequests,
    totalHits,
    totalFaults,
    hitRatio,
    faultRatio,
    steps
  };
}

/**
 * Optimal Page Replacement Simulation (Belady's Min)
 *
 * @param {number[]} referenceString - Array of page numbers.
 * @param {number} frameCount - Number of allocated physical frames.
 * @returns {SimulationResult}
 */
export function simulateOptimal(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      steps.push({
        stepIndex,
        page,
        isHit: true,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        reason: `Page ${page} is already in Frame ${existingIndex}. (PAGE HIT)`
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;
        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          reason: `Page ${page} caused a PAGE FAULT. Loaded into empty Frame ${emptyIndex}.`
        });
      } else {
        // Replacement required: find frame whose page will not be used for longest time in future
        let victimFrameIndex = 0;
        let furthestNextUse = -1;

        for (let i = 0; i < frameCount; i++) {
          const residentPage = frames[i];
          let nextUse = Infinity;

          for (let k = stepIndex + 1; k < referenceString.length; k++) {
            if (referenceString[k] === residentPage) {
              nextUse = k;
              break;
            }
          }

          if (nextUse > furthestNextUse) {
            furthestNextUse = nextUse;
            victimFrameIndex = i;
          }
        }

        const victimPage = frames[victimFrameIndex];
        frames[victimFrameIndex] = page;

        const nextUseDesc = furthestNextUse === Infinity 
          ? 'not referenced again in future' 
          : `not referenced until step ${furthestNextUse + 1}`;

        steps.push({
          stepIndex,
          page,
          isHit: false,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          reason: `Page ${page} caused a PAGE FAULT. Frames full. Evicted Page ${victimPage} from Frame ${victimFrameIndex} (${nextUseDesc}).`
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(1)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(1)) : 0;

  return {
    algorithm: 'OPTIMAL',
    referenceString: [...referenceString],
    frameCount,
    totalRequests,
    totalHits,
    totalFaults,
    hitRatio,
    faultRatio,
    steps
  };
}

/**
 * Dispatcher function to run a selected page replacement algorithm.
 *
 * @param {string} algorithm - 'FIFO' | 'LRU' | 'OPTIMAL'
 * @param {number[]} referenceString - Sequence of page numbers.
 * @param {number} frameCount - Number of physical frames.
 * @returns {SimulationResult}
 */
export function runPageReplacement(algorithm, referenceString, frameCount) {
  const normAlgo = (algorithm || '').toUpperCase();
  switch (normAlgo) {
    case 'FIFO':
      return simulateFIFO(referenceString, frameCount);
    case 'LRU':
      return simulateLRU(referenceString, frameCount);
    case 'OPTIMAL':
      return simulateOptimal(referenceString, frameCount);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}
