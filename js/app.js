/**
 * Application Controller & Event Orchestrator
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 */

import { runPageReplacement } from './algorithms.js';
import {
  renderReferenceStream,
  renderMemoryFrames,
  renderStatistics,
  renderExplanation,
  resetVisualizer
} from './visualizer.js';

// Application State Object
const appState = {
  referenceString: [],
  frameCount: 3,
  selectedAlgorithm: 'FIFO',
  simulationResult: null,
  currentStepIndex: -1,
  isPlaying: false,
  playbackTimer: null,
  playbackSpeedMs: 900,
  hasBackend: false
};

// DOM Element References Cache
const dom = {};

/**
 * Cache necessary DOM nodes
 */
function cacheDOMElements() {
  dom.referenceInput = document.getElementById('reference-string-input');
  dom.frameCountSelect = document.getElementById('frame-count-select');
  dom.algorithmSelect = document.getElementById('algorithm-select');
  dom.btnStart = document.getElementById('btn-start');
  dom.btnPrev = document.getElementById('btn-prev-step');
  dom.btnNext = document.getElementById('btn-next-step');
  dom.btnPlayPause = document.getElementById('btn-play-pause');
  dom.btnRunAll = document.getElementById('btn-run-all');
  dom.btnReset = document.getElementById('btn-reset');
  dom.referenceStreamContainer = document.getElementById('reference-stream-container');
  dom.memoryFramesContainer = document.getElementById('memory-frames-container');
  dom.explanationContainer = document.getElementById('explanation-container');
  dom.engineStatusText = document.getElementById('engine-status-text');
}

/**
 * Validates and parses the reference string input.
 * Accepts numbers separated by commas, spaces, or semicolons.
 * 
 * @param {string} rawString
 * @returns {number[]} Array of parsed integers.
 */
export function parseReferenceString(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('Reference string cannot be empty.');
  }

  const tokens = rawString
    .trim()
    .split(/[\s,;]+/)
    .filter(token => token.length > 0);

  if (tokens.length === 0) {
    throw new Error('Please enter at least one page number.');
  }

  const parsed = [];
  for (const token of tokens) {
    const num = Number(token);
    if (!Number.isInteger(num) || num < 0) {
      throw new Error(`Invalid page reference "${token}". Pages must be non-negative integers.`);
    }
    parsed.push(num);
  }

  return parsed;
}

/**
 * Detects if the optional Python Flask backend is running.
 */
async function detectBackend() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/status', { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'online') {
        appState.hasBackend = true;
        if (dom.engineStatusText) {
          dom.engineStatusText.textContent = 'Python Backend Connected';
        }
        return;
      }
    }
  } catch {
    // Backend not running, client-side JS engine is used
  }
  appState.hasBackend = false;
  if (dom.engineStatusText) {
    dom.engineStatusText.textContent = 'Client Engine Active';
  }
}

/**
 * Clears any active auto-play timer safely.
 */
function stopAutoPlay() {
  if (appState.playbackTimer) {
    clearInterval(appState.playbackTimer);
    appState.playbackTimer = null;
  }
  appState.isPlaying = false;
  if (dom.btnPlayPause) {
    dom.btnPlayPause.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      Play
    `;
  }
}

/**
 * Executes the simulation using Python backend if connected, or client-side engine.
 */
async function executeSimulation(algorithm, referenceString, frameCount) {
  if (appState.hasBackend) {
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, referenceString, frameCount })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Backend call failed, falling back to client-side engine:', err);
    }
  }
  // Client-side execution
  return runPageReplacement(algorithm, referenceString, frameCount);
}

/**
 * Initializes the simulation and starts at Step 1 immediately.
 */
async function handleStartSimulation() {
  stopAutoPlay();

  try {
    const rawRef = dom.referenceInput.value;
    const refString = parseReferenceString(rawRef);
    const frameCount = parseInt(dom.frameCountSelect.value, 10);
    const algorithm = dom.algorithmSelect.value;

    appState.referenceString = refString;
    appState.frameCount = frameCount;
    appState.selectedAlgorithm = algorithm;

    // Run simulation (Python backend if available, client-side fallback)
    appState.simulationResult = await executeSimulation(algorithm, refString, frameCount);

    if (!appState.simulationResult.steps || appState.simulationResult.steps.length === 0) {
      alert('Simulation generated no steps.');
      return;
    }

    // Start immediately at Step 1 (index 0)
    appState.currentStepIndex = 0;
    updateStepView();

    // Enable navigation buttons
    dom.btnPrev.disabled = true; // at step 0
    dom.btnNext.disabled = appState.simulationResult.steps.length <= 1;
    dom.btnPlayPause.disabled = false;
    dom.btnRunAll.disabled = false;

  } catch (err) {
    alert(`Input Error: ${err.message}`);
  }
}

/**
 * Advances simulation by one step.
 */
function handleNextStep() {
  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

  if (appState.currentStepIndex < appState.simulationResult.steps.length - 1) {
    appState.currentStepIndex++;
    updateStepView();
  } else {
    stopAutoPlay();
  }
}

/**
 * Moves simulation back by one step.
 */
function handlePrevStep() {
  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

  if (appState.currentStepIndex > 0) {
    appState.currentStepIndex--;
    updateStepView();
  }
}

/**
 * Updates DOM to reflect the current step snapshot.
 */
function updateStepView() {
  const steps = appState.simulationResult.steps;
  const currIdx = appState.currentStepIndex;

  renderReferenceStream(dom.referenceStreamContainer, appState.referenceString, currIdx);

  if (currIdx === -1) {
    const initialFrames = new Array(appState.frameCount).fill(null);
    const matrixData = {
      referenceString: appState.referenceString,
      frameCount: appState.frameCount,
      steps: steps,
      currentStepIndex: -1
    };
    renderMemoryFrames(dom.memoryFramesContainer, appState.frameCount, initialFrames, null, matrixData);
    renderStatistics({
      totalRequests: appState.referenceString.length,
      hits: 0,
      faults: 0,
      hitRatio: 0,
      faultRatio: 0,
      stepProgress: `0 / ${appState.referenceString.length}`
    });
    renderExplanation(dom.explanationContainer, 'Returned to initial state. Press "Next Step" to advance.');
    dom.btnPrev.disabled = true;
    dom.btnNext.disabled = false;
    return;
  }

  const step = steps[currIdx];
  const highlightInfo = {
    slotIndex: step.victimFrameIndex,
    isHit: step.isHit
  };

  const matrixData = {
    referenceString: appState.referenceString,
    frameCount: appState.frameCount,
    steps: steps,
    currentStepIndex: currIdx
  };

  renderMemoryFrames(dom.memoryFramesContainer, appState.frameCount, step.frames, highlightInfo, matrixData);

  // Cumulative stats up to this step
  const executedSteps = steps.slice(0, currIdx + 1);
  const hitsSoFar = executedSteps.filter(s => s.isHit).length;
  const faultsSoFar = executedSteps.filter(s => !s.isHit).length;
  const hitRatio = Math.round((hitsSoFar / executedSteps.length) * 100);
  const faultRatio = Math.round((faultsSoFar / executedSteps.length) * 100);

  renderStatistics({
    totalRequests: appState.referenceString.length,
    hits: hitsSoFar,
    faults: faultsSoFar,
    hitRatio,
    faultRatio,
    stepProgress: `${currIdx + 1} / ${appState.referenceString.length}`
  });

  renderExplanation(dom.explanationContainer, step.reason, step.isHit);

  dom.btnPrev.disabled = currIdx <= 0;
  dom.btnNext.disabled = currIdx >= steps.length - 1;
}

/**
 * Toggles auto-playback of steps.
 */
function handlePlayPause() {
  if (appState.isPlaying) {
    stopAutoPlay();
  } else {
    if (!appState.simulationResult || !appState.simulationResult.steps.length) return;
    
    // If at end, loop to beginning
    if (appState.currentStepIndex >= appState.simulationResult.steps.length - 1) {
      appState.currentStepIndex = 0;
      updateStepView();
    }

    appState.isPlaying = true;
    dom.btnPlayPause.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      Pause
    `;

    appState.playbackTimer = setInterval(() => {
      if (appState.currentStepIndex < appState.simulationResult.steps.length - 1) {
        handleNextStep();
      } else {
        stopAutoPlay();
      }
    }, appState.playbackSpeedMs);
  }
}

/**
 * Runs all steps instantly to the end.
 */
function handleRunAll() {
  stopAutoPlay();
  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;
  appState.currentStepIndex = appState.simulationResult.steps.length - 1;
  updateStepView();
}

/**
 * Resets the entire simulation state and UI.
 */
function handleReset() {
  stopAutoPlay();
  appState.simulationResult = null;
  appState.currentStepIndex = -1;
  resetVisualizer();

  dom.btnPrev.disabled = true;
  dom.btnNext.disabled = true;
  dom.btnPlayPause.disabled = true;
  dom.btnRunAll.disabled = true;
}

/**
 * Sets up all event listeners on DOM ready.
 */
function initializeApp() {
  cacheDOMElements();
  detectBackend();

  dom.btnStart.addEventListener('click', handleStartSimulation);
  dom.btnPrev.addEventListener('click', handlePrevStep);
  dom.btnNext.addEventListener('click', handleNextStep);
  dom.btnPlayPause.addEventListener('click', handlePlayPause);
  dom.btnRunAll.addEventListener('click', handleRunAll);
  dom.btnReset.addEventListener('click', handleReset);
}

// Bootstrap once DOM content is parsed (Browser runtime)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}
