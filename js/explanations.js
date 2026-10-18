/**
 * Educational Step Explanation Generator
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 * 
 * Generates structured pedagogical explanations and natural audio narrations for:
 * - FIFO (First-In, First-Out)
 * - LRU (Least Recently Used)
 * - OPTIMAL (Belady's Min Algorithm)
 * 
 * Implements the 8-section logical structure:
 * A. Step Title
 * B. What Happened?
 * C. Current Memory State
 * D. Why Did This Happen?
 * E. Algorithm Decision
 * F. Action Taken
 * G. Updated Memory
 * H. Running Statistics
 */

/**
 * Formats memory frame contents into natural English text.
 * Example: "Frame 0 contains page 7, Frame 1 is empty, and Frame 2 contains page 1"
 * 
 * @param {Array<number|null>} frames
 * @returns {string}
 */
export function describeFrames(frames) {
  if (!frames || frames.length === 0) return 'all frames are empty';
  
  const allEmpty = frames.every(f => f === null || f === undefined);
  if (allEmpty) return 'all frames are empty';

  const parts = frames.map((val, idx) => {
    if (val !== null && val !== undefined) {
      return `Frame ${idx} contains page ${val}`;
    } else {
      return `Frame ${idx} is empty`;
    }
  });

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}

/**
 * Formats memory frames for natural speech.
 * Converts digits into spoken words if desired for smoother audio.
 * 
 * @param {Array<number|null>} frames
 * @returns {string}
 */
export function describeFramesForAudio(frames) {
  return describeFrames(frames);
}

/**
 * Generates an algorithm-aware structured explanation and natural audio narration.
 * 
 * @param {Object} params
 * @param {string} params.algorithm - 'FIFO' | 'LRU' | 'OPTIMAL'
 * @param {number[]} params.referenceString - Full reference string
 * @param {number} params.frameCount - Total physical frames
 * @param {number} params.stepIndex - 0-based step index
 * @param {number} params.requestedPage - Page referenced
 * @param {Array<number|null>} params.framesBefore - Frame state before request
 * @param {Array<number|null>} params.framesAfter - Frame state after request
 * @param {boolean} params.isHit - True if page hit
 * @param {string} params.eventType - 'HIT' | 'FAULT_INITIAL' | 'FAULT_REPLACE'
 * @param {number|null} params.victimPage - Evicted page if any
 * @param {number|null} params.victimFrameIndex - Frame index modified or hit
 * @param {number} params.cumulativeHits - Hits up to this step
 * @param {number} params.cumulativeFaults - Faults up to this step
 * @param {Object} [params.replacementMetadata] - Algorithm-specific tracking data
 * @returns {Object} Explanation result containing stepTitle, eventTypeTitle, displayHtml, displayText, audioNarration, and shortReason.
 */
export function generateStepExplanation({
  algorithm,
  referenceString,
  frameCount,
  stepIndex,
  requestedPage,
  framesBefore = [],
  framesAfter = [],
  isHit,
  eventType,
  victimPage = null,
  victimFrameIndex = 0,
  cumulativeHits = 0,
  cumulativeFaults = 0,
  replacementMetadata = {}
}) {
  const stepNumber = stepIndex + 1;
  const totalRequests = referenceString ? referenceString.length : stepNumber;
  const algoNorm = (algorithm || 'FIFO').toUpperCase();
  const totalProcessed = cumulativeHits + cumulativeFaults;
  
  // Consistent 2-decimal precision for percentages
  const hitRatio = totalProcessed > 0 ? ((cumulativeHits / totalProcessed) * 100).toFixed(2) : '0.00';
  const faultRatio = totalProcessed > 0 ? ((cumulativeFaults / totalProcessed) * 100).toFixed(2) : '0.00';

  // --- A. STEP TITLE & EVENT CLASSIFICATION ---
  const stepTitle = `Step ${stepNumber} of ${totalRequests} — Page ${requestedPage}`;
  let eventTypeTitle = '';
  let shortReason = '';
  let audioIntro = '';

  if (isHit) {
    eventTypeTitle = 'PAGE HIT';
    shortReason = `Page ${requestedPage} is already in Frame ${victimFrameIndex}. (PAGE HIT)`;
    audioIntro = `Step ${stepNumber}, Page ${requestedPage}, It is Page Hit.`;
  } else if (eventType === 'FAULT_INITIAL' || victimPage === null) {
    eventTypeTitle = 'PAGE FAULT — EMPTY FRAME AVAILABLE';
    shortReason = `Page ${requestedPage} caused a PAGE FAULT. Loaded into empty Frame ${victimFrameIndex}.`;
    audioIntro = `Step ${stepNumber}, Page ${requestedPage}, It is Page Fault Because Empty Frame is available.`;
  } else {
    eventTypeTitle = 'PAGE FAULT — PAGE REPLACEMENT REQUIRED';
    shortReason = `Page ${requestedPage} caused a PAGE FAULT. Evicted Page ${victimPage} from Frame ${victimFrameIndex}.`;
    audioIntro = `Step ${stepNumber}, Page ${requestedPage}, It is Page Fault Because Page Replacement is required.`;
  }

  // --- B. WHAT HAPPENED? ---
  let whatHappened = '';
  let whatHappenedAudio = '';
  if (isHit) {
    whatHappened = `The CPU requested page ${requestedPage}. This page is already in memory, so this is a page hit. No page needs to be loaded from secondary storage.`;
    whatHappenedAudio = `The CPU requested page ${requestedPage}. This page is already in memory, so this is a page hit. No page needs to be loaded from secondary storage.`;
  } else if (eventType === 'FAULT_INITIAL' || victimPage === null) {
    whatHappened = `The CPU requested page ${requestedPage}, but it is not currently in memory. This is a page fault, so the operating system must load the page into memory.`;
    whatHappenedAudio = `The CPU requested page ${requestedPage}, but it is not currently in memory. This is a page fault, so the operating system must load the page into memory.`;
  } else {
    whatHappened = `The CPU requested page ${requestedPage}, but it is not currently in memory. This is a page fault, and all frames are full, so the operating system must replace an existing page to load page ${requestedPage}.`;
    whatHappenedAudio = `The CPU requested page ${requestedPage}, but it is not currently in memory. This is a page fault, and all frames are full, so the operating system must replace an existing page to load page ${requestedPage}.`;
  }

  // --- C. CURRENT MEMORY STATE ---
  const beforeDesc = describeFrames(framesBefore);
  const currentMemory = `Before this request, ${beforeDesc}.`;
  const currentMemoryAudio = `Before this request, ${beforeDesc}.`;

  // --- D. WHY DID THIS HAPPEN? ---
  let whyDidThisHappen = '';
  let whyDidThisHappenAudio = '';
  if (isHit) {
    whyDidThisHappen = `Page ${requestedPage} is already resident in Frame ${victimFrameIndex}, allowing immediate CPU access without secondary storage delay.`;
    whyDidThisHappenAudio = `Page ${requestedPage} is already stored in Frame ${victimFrameIndex}, allowing immediate CPU access without secondary storage delay.`;
  } else if (eventType === 'FAULT_INITIAL' || victimPage === null) {
    whyDidThisHappen = `Page ${requestedPage} was not found in any frame, which causes a page fault. Because Frame ${victimFrameIndex} is currently empty, the operating system can place page ${requestedPage} directly into memory without removing any existing page.`;
    whyDidThisHappenAudio = `Page ${requestedPage} was not resident in any frame, causing a page fault. Because Frame ${victimFrameIndex} is currently empty, the operating system can load page ${requestedPage} directly without removing any existing page.`;
  } else {
    whyDidThisHappen = `Page ${requestedPage} was not found in any frame, causing a page fault. Since all ${frameCount} physical frames are currently occupied, an existing resident page must be chosen for removal.`;
    whyDidThisHappenAudio = `Page ${requestedPage} was not resident in any frame, causing a page fault. Because all ${frameCount} frames are full, an existing resident page must be chosen for removal.`;
  }

  // --- E. ALGORITHM DECISION ---
  let algoDecision = '';
  let algoDecisionAudio = '';

  if (isHit) {
    if (algoNorm === 'FIFO') {
      algoDecision = `Under First-In, First-Out (FIFO), a page hit does not alter the arrival order of resident pages. Frame ${victimFrameIndex} keeps its current position in the arrival queue.`;
      algoDecisionAudio = `Under First-In, First-Out, a page hit does not alter the arrival order of resident pages.`;
    } else if (algoNorm === 'LRU') {
      algoDecision = `Under Least Recently Used (LRU), accessing page ${requestedPage} in Frame ${victimFrameIndex} updates its access timestamp to Step ${stepNumber}, marking it as the most recently referenced page.`;
      algoDecisionAudio = `Under Least Recently Used, referencing page ${requestedPage} updates its access time to Step ${stepNumber}, making it the most recently used page.`;
    } else if (algoNorm === 'OPTIMAL') {
      algoDecision = `Under Belady's Optimal algorithm, the requested page is already resident, so memory contents remain unchanged.`;
      algoDecisionAudio = `Under Belady's Optimal algorithm, the requested page is already resident, so memory contents remain unchanged.`;
    } else {
      algoDecision = `Under ${algoNorm}, the requested page is already present in Frame ${victimFrameIndex}.`;
      algoDecisionAudio = `Under ${algoNorm}, the requested page is already resident in memory.`;
    }
  } else if (eventType === 'FAULT_INITIAL' || victimPage === null) {
    if (algoNorm === 'FIFO') {
      const qPos = replacementMetadata.queuePosition ?? (framesBefore.filter(f => f !== null).length + 1);
      algoDecision = `Under First-In, First-Out (FIFO), an empty frame is available, so no page replacement is required. Page ${requestedPage} is loaded into Frame ${victimFrameIndex} and placed at position ${qPos} in the arrival queue.`;
      algoDecisionAudio = `Under First-In, First-Out, an empty frame is available, so no page replacement is needed. Page ${requestedPage} is loaded into Frame ${victimFrameIndex}.`;
    } else if (algoNorm === 'LRU') {
      algoDecision = `Under Least Recently Used (LRU), an empty frame is available, so no page replacement is required. Page ${requestedPage} is loaded into Frame ${victimFrameIndex} and its access time is recorded as Step ${stepNumber}.`;
      algoDecisionAudio = `Under Least Recently Used, an empty frame is available, so no page replacement is needed. Page ${requestedPage} is loaded into Frame ${victimFrameIndex}.`;
    } else if (algoNorm === 'OPTIMAL') {
      algoDecision = `Under Belady's Optimal algorithm, Frame ${victimFrameIndex} is empty, so no page replacement is needed. Page ${requestedPage} is directly allocated into Frame ${victimFrameIndex}.`;
      algoDecisionAudio = `Under Belady's Optimal algorithm, an empty frame is available, so no page replacement is needed. Page ${requestedPage} is loaded into Frame ${victimFrameIndex}.`;
    } else {
      algoDecision = `Under ${algoNorm}, an empty frame is available, so page ${requestedPage} is allocated into Frame ${victimFrameIndex} without replacement.`;
      algoDecisionAudio = `Under ${algoNorm}, an empty frame is available, so no page replacement is needed.`;
    }
  } else {
    // Replacement required
    if (algoNorm === 'FIFO') {
      const oldestArrival = replacementMetadata.oldestArrivalStep ?? 'an earlier step';
      algoDecision = `Under First-In, First-Out (FIFO), the operating system replaces the resident page that arrived earliest in physical memory. Page ${victimPage} in Frame ${victimFrameIndex} was loaded at Step ${oldestArrival}, making it the oldest resident page, so it is chosen as the victim.`;
      algoDecisionAudio = `Under First-In, First-Out, the page that entered memory earliest is replaced first. Page ${victimPage} in Frame ${victimFrameIndex} arrived first at Step ${oldestArrival}, so it is chosen as the victim page.`;
    } else if (algoNorm === 'LRU') {
      const oldestAccess = replacementMetadata.oldestAccessStep ?? 'an earlier step';
      algoDecision = `Under Least Recently Used (LRU), the operating system replaces the resident page that has not been referenced for the longest time. Page ${victimPage} in Frame ${victimFrameIndex} was last accessed at Step ${oldestAccess}, longer ago than any other resident page, so it is chosen as the victim.`;
      algoDecisionAudio = `Under Least Recently Used, the page that has not been used for the longest time is replaced. Page ${victimPage} in Frame ${victimFrameIndex} was last accessed at Step ${oldestAccess}, longer ago than any other resident page, so it is chosen as the victim page.`;
    } else if (algoNorm === 'OPTIMAL') {
      let nextUseDesc = '';
      if (replacementMetadata.furthestNextUse === Infinity || replacementMetadata.furthestNextUse === null || replacementMetadata.furthestNextUse === undefined) {
        nextUseDesc = `Page ${victimPage} will not be referenced again in the remaining reference string`;
      } else {
        nextUseDesc = `Page ${victimPage} is not referenced until Step ${replacementMetadata.furthestNextUse + 1}, which is further in the future than any other resident page`;
      }
      const tieNote = replacementMetadata.tieBreaker ? ` (${replacementMetadata.tieBreaker})` : '';
      algoDecision = `Under Belady's Optimal algorithm, the operating system looks ahead at future requests. ${nextUseDesc}${tieNote}. Therefore, Frame ${victimFrameIndex} holding Page ${victimPage} is selected for replacement.`;
      algoDecisionAudio = `Under Belady's Optimal algorithm, the operating system looks ahead at future requests. ${nextUseDesc}. Therefore, Frame ${victimFrameIndex} holding Page ${victimPage} is chosen for replacement.`;
    } else {
      algoDecision = `Under ${algoNorm}, Page ${victimPage} in Frame ${victimFrameIndex} is chosen as the victim page according to the replacement strategy.`;
      algoDecisionAudio = `Under ${algoNorm}, Page ${victimPage} in Frame ${victimFrameIndex} is chosen as the victim page.`;
    }
  }

  // --- F. ACTION TAKEN ---
  let actionTaken = '';
  let actionTakenAudio = '';
  if (isHit) {
    actionTaken = `No page was removed or loaded. Frame contents remain unchanged.`;
    actionTakenAudio = `No page was removed or loaded. Memory contents remain unchanged.`;
  } else if (eventType === 'FAULT_INITIAL' || victimPage === null) {
    actionTaken = `Page ${requestedPage} was loaded into empty Frame ${victimFrameIndex}. No page was removed.`;
    actionTakenAudio = `Page ${requestedPage} was loaded into empty Frame ${victimFrameIndex}. No page was removed.`;
  } else {
    actionTaken = `Page ${victimPage} was removed from Frame ${victimFrameIndex}, and page ${requestedPage} was loaded into Frame ${victimFrameIndex}.`;
    actionTakenAudio = `Page ${victimPage} was removed from Frame ${victimFrameIndex}, and page ${requestedPage} was loaded into Frame ${victimFrameIndex}.`;
  }

  // --- G. UPDATED MEMORY ---
  const afterDesc = describeFrames(framesAfter);
  const updatedMemory = `After this request, ${afterDesc}.`;
  const updatedMemoryAudio = `After this request, ${afterDesc}.`;

  // --- H. RUNNING STATISTICS (Available in data model) ---
  const runningStats = `Running statistics: Total requests: ${stepNumber}, Page hits: ${cumulativeHits} (${hitRatio}%), Page faults: ${cumulativeFaults} (${faultRatio}%).`;

  // --- STRUCTURED DISPLAY HTML ---
  const displayHtml = `
    <div class="explanation-sections">
      <div class="expl-section">
        <div class="expl-label">What Happened?</div>
        <div class="expl-text">${whatHappened}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Current Memory State</div>
        <div class="expl-text">${currentMemory}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Why Did This Happen?</div>
        <div class="expl-text">${whyDidThisHappen}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Algorithm Decision (${algoNorm})</div>
        <div class="expl-text">${algoDecision}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Action Taken</div>
        <div class="expl-text">${actionTaken}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Updated Memory</div>
        <div class="expl-text">${updatedMemory}</div>
      </div>
    </div>
  `;

  // Plain text representation for tests or fallbacks
  const displayText = [
    `[${stepTitle}] [${eventTypeTitle}]`,
    `What Happened: ${whatHappened}`,
    `Current Memory State: ${currentMemory}`,
    `Why Did This Happen: ${whyDidThisHappen}`,
    `Algorithm Decision: ${algoDecision}`,
    `Action Taken: ${actionTaken}`,
    `Updated Memory: ${updatedMemory}`
  ].join('\n');

  // Smooth, natural spoken narration for audio
  const audioNarration = [
    audioIntro,
    whatHappenedAudio,
    currentMemoryAudio,
    whyDidThisHappenAudio,
    algoDecisionAudio,
    actionTakenAudio,
    updatedMemoryAudio
  ].join(' ');

  return {
    stepTitle,
    eventTypeTitle,
    title: eventTypeTitle,
    shortReason,
    displayHtml,
    displayText,
    audioNarration,
    // Keep text property for backward compatibility with existing readers
    text: displayText,
    explanation: displayText,
    sections: {
      whatHappened,
      currentMemory,
      whyDidThisHappen,
      algoDecision,
      actionTaken,
      updatedMemory,
      runningStats
    }
  };
}
