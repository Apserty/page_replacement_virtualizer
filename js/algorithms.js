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

import { generateStepExplanation } from './explanations.js';

/**
 * First-In, First-Out (FIFO) Page Replacement Simulation
 *
 * @param {number[]} referenceString - Array of page numbers.
 * @param {number} frameCount - Number of allocated physical frames.
 * @returns {Object} SimulationResult
 */
export function simulateFIFO(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const fifoQueue = []; // tracks frame indices in order of arrival
  const arrivalStepMap = new Map(); // frameIndex -> stepNumber (1-based)
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const framesBefore = [...frames];
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      const stepExplanation = generateStepExplanation({
        algorithm: 'FIFO',
        referenceString,
        frameCount,
        stepIndex,
        requestedPage: page,
        framesBefore,
        framesAfter: [...frames],
        isHit: true,
        eventType: 'HIT',
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults,
        replacementMetadata: {
          queuePosition: fifoQueue.indexOf(existingIndex) + 1
        }
      });

      steps.push({
        stepIndex,
        page,
        isHit: true,
        eventType: 'HIT',
        framesBefore,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults,
        reason: stepExplanation.shortReason,
        explanation: stepExplanation.displayText,
        displayHtml: stepExplanation.displayHtml,
        audioNarration: stepExplanation.audioNarration,
        title: stepExplanation.eventTypeTitle,
        stepTitle: stepExplanation.stepTitle,
        eventTypeTitle: stepExplanation.eventTypeTitle,
        sections: stepExplanation.sections,
        replacementMetadata: {
          queuePosition: fifoQueue.indexOf(existingIndex) + 1
        }
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;
        fifoQueue.push(emptyIndex);
        arrivalStepMap.set(emptyIndex, stepIndex + 1);

        const stepExplanation = generateStepExplanation({
          algorithm: 'FIFO',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_INITIAL',
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          replacementMetadata: {
            queuePosition: fifoQueue.length
          }
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_INITIAL',
          framesBefore,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections,
          replacementMetadata: {
            queuePosition: fifoQueue.length
          }
        });
      } else {
        // Replacement required: oldest frame in fifoQueue is replaced
        const victimFrameIndex = fifoQueue.shift();
        const victimPage = frames[victimFrameIndex];
        const oldestArrivalStep = arrivalStepMap.get(victimFrameIndex);

        frames[victimFrameIndex] = page;
        fifoQueue.push(victimFrameIndex);
        arrivalStepMap.set(victimFrameIndex, stepIndex + 1);

        const stepExplanation = generateStepExplanation({
          algorithm: 'FIFO',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_REPLACE',
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          replacementMetadata: {
            oldestArrivalStep
          }
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_REPLACE',
          framesBefore,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections,
          replacementMetadata: {
            oldestArrivalStep
          }
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(2)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(2)) : 0;

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
 * @returns {Object} SimulationResult
 */
export function simulateLRU(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const lastUsedMap = new Map(); // page -> last referenced step index (0-based)
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const framesBefore = [...frames];
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      lastUsedMap.set(page, stepIndex);

      const stepExplanation = generateStepExplanation({
        algorithm: 'LRU',
        referenceString,
        frameCount,
        stepIndex,
        requestedPage: page,
        framesBefore,
        framesAfter: [...frames],
        isHit: true,
        eventType: 'HIT',
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults,
        replacementMetadata: {
          lastUsedStep: stepIndex + 1
        }
      });

      steps.push({
        stepIndex,
        page,
        isHit: true,
        eventType: 'HIT',
        framesBefore,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults,
        reason: stepExplanation.shortReason,
        explanation: stepExplanation.displayText,
        displayHtml: stepExplanation.displayHtml,
        audioNarration: stepExplanation.audioNarration,
        title: stepExplanation.eventTypeTitle,
        stepTitle: stepExplanation.stepTitle,
        eventTypeTitle: stepExplanation.eventTypeTitle,
        sections: stepExplanation.sections,
        replacementMetadata: {
          lastUsedStep: stepIndex + 1
        }
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;
        lastUsedMap.set(page, stepIndex);

        const stepExplanation = generateStepExplanation({
          algorithm: 'LRU',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_INITIAL',
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          replacementMetadata: {
            lastUsedStep: stepIndex + 1
          }
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_INITIAL',
          framesBefore,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections,
          replacementMetadata: {
            lastUsedStep: stepIndex + 1
          }
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

        const stepExplanation = generateStepExplanation({
          algorithm: 'LRU',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_REPLACE',
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          replacementMetadata: {
            oldestAccessStep: oldestStep + 1
          }
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_REPLACE',
          framesBefore,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections,
          replacementMetadata: {
            oldestAccessStep: oldestStep + 1
          }
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(2)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(2)) : 0;

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
 * @returns {Object} SimulationResult
 */
export function simulateOptimal(referenceString, frameCount) {
  const frames = new Array(frameCount).fill(null);
  const steps = [];
  let totalHits = 0;
  let totalFaults = 0;

  referenceString.forEach((page, stepIndex) => {
    const framesBefore = [...frames];
    const existingIndex = frames.indexOf(page);

    if (existingIndex !== -1) {
      // PAGE HIT
      totalHits++;
      const stepExplanation = generateStepExplanation({
        algorithm: 'OPTIMAL',
        referenceString,
        frameCount,
        stepIndex,
        requestedPage: page,
        framesBefore,
        framesAfter: [...frames],
        isHit: true,
        eventType: 'HIT',
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults
      });

      steps.push({
        stepIndex,
        page,
        isHit: true,
        eventType: 'HIT',
        framesBefore,
        frames: [...frames],
        victimPage: null,
        victimFrameIndex: existingIndex,
        cumulativeHits: totalHits,
        cumulativeFaults: totalFaults,
        reason: stepExplanation.shortReason,
        explanation: stepExplanation.displayText,
        displayHtml: stepExplanation.displayHtml,
        audioNarration: stepExplanation.audioNarration,
        title: stepExplanation.eventTypeTitle,
        stepTitle: stepExplanation.stepTitle,
        eventTypeTitle: stepExplanation.eventTypeTitle,
        sections: stepExplanation.sections
      });
    } else {
      // PAGE FAULT
      totalFaults++;
      const emptyIndex = frames.indexOf(null);

      if (emptyIndex !== -1) {
        // Empty frame slot available
        frames[emptyIndex] = page;

        const stepExplanation = generateStepExplanation({
          algorithm: 'OPTIMAL',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_INITIAL',
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_INITIAL',
          framesBefore,
          frames: [...frames],
          victimPage: null,
          victimFrameIndex: emptyIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections
        });
      } else {
        // Replacement required: find frame whose page will not be used for longest time in future
        let victimFrameIndex = 0;
        let furthestNextUse = -1;
        let ties = [];

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
            ties = [i];
          } else if (nextUse === furthestNextUse) {
            ties.push(i);
          }
        }

        const victimPage = frames[victimFrameIndex];
        frames[victimFrameIndex] = page;

        const nextUseDesc = furthestNextUse === Infinity 
          ? 'it is never referenced again in the future reference string' 
          : `its next reference is at Step ${furthestNextUse + 1}, which is furthest in the future`;

        const tieBreaker = ties.length > 1 ? 'lowest frame index chosen as tie-breaker' : null;

        const stepExplanation = generateStepExplanation({
          algorithm: 'OPTIMAL',
          referenceString,
          frameCount,
          stepIndex,
          requestedPage: page,
          framesBefore,
          framesAfter: [...frames],
          isHit: false,
          eventType: 'FAULT_REPLACE',
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          replacementMetadata: {
            furthestNextUse,
            nextUseDesc,
            tieBreaker
          }
        });

        steps.push({
          stepIndex,
          page,
          isHit: false,
          eventType: 'FAULT_REPLACE',
          framesBefore,
          frames: [...frames],
          victimPage,
          victimFrameIndex,
          cumulativeHits: totalHits,
          cumulativeFaults: totalFaults,
          reason: stepExplanation.shortReason,
          explanation: stepExplanation.displayText,
          displayHtml: stepExplanation.displayHtml,
          audioNarration: stepExplanation.audioNarration,
          title: stepExplanation.eventTypeTitle,
          stepTitle: stepExplanation.stepTitle,
          eventTypeTitle: stepExplanation.eventTypeTitle,
          sections: stepExplanation.sections,
          replacementMetadata: {
            furthestNextUse,
            nextUseDesc,
            tieBreaker
          }
        });
      }
    }
  });

  const totalRequests = referenceString.length;
  const hitRatio = totalRequests > 0 ? Number(((totalHits / totalRequests) * 100).toFixed(2)) : 0;
  const faultRatio = totalRequests > 0 ? Number(((totalFaults / totalRequests) * 100).toFixed(2)) : 0;

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
 * @returns {Object} SimulationResult
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
