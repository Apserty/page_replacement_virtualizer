/**
 * Application Controller & Event Orchestrator
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 */

import { runPageReplacement } from './algorithms.js';
import { audioTutor } from './audioTutor.js';
import {
  renderReferenceStream,
  renderMemoryFrames,
  renderStatistics,
  renderExplanation,
  updateAudioTutorUI,
  resetVisualizer
} from './visualizer.js';

// Application State Object
const appState = {
  referenceString: [],
  frameCount: 3,
  selectedAlgorithm: 'FIFO',
  simulationResult: null,
  currentStepIndex: -1,
  isInspectingHistoricalStep: false,
  isPlaying: false,
  playbackTimeout: null,
  playbackBaseIntervalMs: 1200,
  hasBackend: false,
  isCompletedSimulation: false
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

  // Audio Tutor Elements
  dom.audioVoiceSelect = document.getElementById('audio-voice-select');
  dom.audioSpeedSelect = document.getElementById('audio-speed-select');
  dom.btnAudioSpeak = document.getElementById('btn-audio-speak');
  dom.btnAudioPauseResume = document.getElementById('btn-audio-pause-resume');
  dom.btnAudioStop = document.getElementById('btn-audio-stop');
  dom.btnAudioReplay = document.getElementById('btn-audio-replay');
  dom.btnAudioMute = document.getElementById('btn-audio-mute');
  dom.btnAudioNarrateAll = document.getElementById('btn-audio-narrate-all');
}

/**
 * Validates and parses the reference string input.
 * Accepts numbers separated by commas, spaces, or semicolons.
 * 
 * @param {string} rawString
 * @returns {number[]} Array of parsed non-negative integers.
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
  if (appState.playbackTimeout) {
    clearTimeout(appState.playbackTimeout);
    appState.playbackTimeout = null;
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
 * Updates DOM to reflect the current step snapshot.
 * 
 * @param {Object} [options]
 * @param {boolean} [options.speak] - If true, triggers speech for this step.
 * @param {boolean} [options.isHistorical] - If true, indicates inspecting a historical step.
 */
function updateStepView(options = {}) {
  const steps = appState.simulationResult ? appState.simulationResult.steps : [];
  const currIdx = appState.currentStepIndex;
  const isHistorical = options.isHistorical || appState.isInspectingHistoricalStep;

  renderReferenceStream(dom.referenceStreamContainer, appState.referenceString, currIdx);

  if (currIdx === -1 || !steps || steps.length === 0) {
    const initialFrames = new Array(appState.frameCount).fill(null);
    const matrixData = {
      referenceString: appState.referenceString,
      frameCount: appState.frameCount,
      steps: steps,
      currentStepIndex: -1,
      isCompleted: appState.isCompletedSimulation,
      onStepClick: handleHistoricalStepClick
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
    renderExplanation(dom.explanationContainer, 'Simulation initialized. Click "Next Step" or "Play" to start.');
    updateAudioTutorUI(audioTutor.getState(), null, steps.length, false);

    dom.btnPrev.disabled = true;
    dom.btnNext.disabled = steps.length === 0;
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
    currentStepIndex: currIdx,
    isCompleted: appState.isCompletedSimulation,
    onStepClick: handleHistoricalStepClick
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

  renderExplanation(dom.explanationContainer, step, step.isHit, { isHistorical });
  updateAudioTutorUI(audioTutor.getState(), step, steps.length, isHistorical);

  dom.btnPrev.disabled = currIdx <= 0;
  dom.btnNext.disabled = currIdx >= steps.length - 1;

  if (options.speak && !audioTutor.isMuted) {
    audioTutor.speak(step.audioNarration || step.explanation, {
      stepIndex: currIdx,
      onEnd: options.onSpeechEnd
    });
  }
}

/**
 * Initializes the simulation and starts at Step 1 (index 0).
 * Does not speak the whole reference string automatically.
 */
async function handleStartSimulation() {
  stopAutoPlay();
  audioTutor.stop();

  try {
    const rawRef = dom.referenceInput.value;
    const refString = parseReferenceString(rawRef);
    const frameCount = parseInt(dom.frameCountSelect.value, 10);
    const algorithm = dom.algorithmSelect.value;

    appState.referenceString = refString;
    appState.frameCount = frameCount;
    appState.selectedAlgorithm = algorithm;
    appState.isCompletedSimulation = false;
    appState.isInspectingHistoricalStep = false;

    // Run simulation (Python backend if available, client-side fallback)
    appState.simulationResult = await executeSimulation(algorithm, refString, frameCount);

    if (!appState.simulationResult.steps || appState.simulationResult.steps.length === 0) {
      alert('Simulation generated no steps.');
      return;
    }

    // Start immediately at Step 1 (index 0) without auto-speaking
    appState.currentStepIndex = 0;
    updateStepView({ speak: false });

    // Enable toolbar controls
    dom.btnPrev.disabled = true; // at step 0
    dom.btnNext.disabled = appState.simulationResult.steps.length <= 1;
    dom.btnPlayPause.disabled = false;
    dom.btnRunAll.disabled = false;

  } catch (err) {
    alert(`Input Error: ${err.message}`);
  }
}

/**
 * Advances simulation by exactly ONE position and speaks its explanation.
 */
function handleNextStep() {
  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

  stopAutoPlay();
  audioTutor.stop();
  appState.isInspectingHistoricalStep = false;

  if (appState.currentStepIndex < appState.simulationResult.steps.length - 1) {
    appState.currentStepIndex++;
    updateStepView({ speak: true });
  }
}

/**
 * Moves simulation back by exactly ONE position, restores earlier state,
 * and speaks only the restored event's explanation.
 */
function handlePrevStep() {
  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

  stopAutoPlay();
  audioTutor.stop();
  appState.isInspectingHistoricalStep = false;

  if (appState.currentStepIndex > 0) {
    appState.currentStepIndex--;
    updateStepView({ speak: true });
  }
}

/**
 * Handles inspecting a historical step when the user clicks on any step column
 * in the Memory Frames timeline matrix.
 * 
 * @param {number} stepIndex - 0-based step index clicked
 */
function handleHistoricalStepClick(stepIndex) {
  if (!appState.simulationResult || !appState.simulationResult.steps[stepIndex]) return;

  stopAutoPlay();
  audioTutor.stop();

  appState.currentStepIndex = stepIndex;
  appState.isInspectingHistoricalStep = true;
  updateStepView({ speak: false, isHistorical: true });
}

/**
 * Plays the simulation sequentially from the current position.
 * Explains events step-by-step and advances after narration finishes.
 */
function handlePlayPause() {
  if (appState.isPlaying) {
    stopAutoPlay();
    audioTutor.pause();
  } else {
    if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

    audioTutor.stop();
    appState.isInspectingHistoricalStep = false;

    // If at end, loop to beginning
    if (appState.currentStepIndex >= appState.simulationResult.steps.length - 1) {
      appState.currentStepIndex = 0;
    }

    appState.isPlaying = true;
    if (dom.btnPlayPause) {
      dom.btnPlayPause.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
        Pause
      `;
    }

    playCurrentStepAndScheduleNext();
  }
}

/**
 * Helper to execute a single step during sequential Play mode
 * and wait for narration completion before proceeding.
 */
function playCurrentStepAndScheduleNext() {
  if (!appState.isPlaying) return;

  const steps = appState.simulationResult.steps;
  if (appState.currentStepIndex >= steps.length) {
    stopAutoPlay();
    return;
  }

  const step = steps[appState.currentStepIndex];

  // Update view without speaking via updateStepView to avoid double trigger
  updateStepView({ speak: false });

  // Function to advance to next step
  const advanceToNext = () => {
    if (!appState.isPlaying) return;
    if (appState.currentStepIndex < steps.length - 1) {
      appState.currentStepIndex++;
      // Natural pedagogical pause between steps
      appState.playbackTimeout = setTimeout(() => {
        playCurrentStepAndScheduleNext();
      }, 500);
    } else {
      stopAutoPlay();
    }
  };

  // Speak step explanation
  if (audioTutor.isSupported && !audioTutor.isMuted) {
    audioTutor.speak(step.audioNarration || step.explanation, {
      stepIndex: appState.currentStepIndex,
      onEnd: () => {
        if (appState.isPlaying) advanceToNext();
      },
      onError: (e) => {
        if (e && (e.error === 'canceled' || e.error === 'interrupted')) return;
        if (appState.isPlaying) advanceToNext();
      }
    });
  } else {
    // If audio is muted or unsupported, advance based on fixed duration
    appState.playbackTimeout = setTimeout(() => {
      if (appState.isPlaying) advanceToNext();
    }, appState.playbackBaseIntervalMs);
  }
}

/**
 * Runs all steps instantly to the end.
 * Calculates everything immediately without sequential animation or narration.
 */
function handleRunAll() {
  stopAutoPlay();
  audioTutor.stop();

  if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

  appState.isCompletedSimulation = true;
  appState.isInspectingHistoricalStep = false;
  appState.currentStepIndex = appState.simulationResult.steps.length - 1;

  updateStepView({ speak: false });
}

/**
 * Resets the entire simulation state, cancels timers, stops speech immediately.
 */
function handleReset() {
  stopAutoPlay();
  audioTutor.stop();

  appState.simulationResult = null;
  appState.currentStepIndex = -1;
  appState.isCompletedSimulation = false;
  appState.isInspectingHistoricalStep = false;

  resetVisualizer();
  updateAudioTutorUI(audioTutor.getState(), null, 0, false);

  dom.btnPrev.disabled = true;
  dom.btnNext.disabled = true;
  dom.btnPlayPause.disabled = true;
  dom.btnRunAll.disabled = true;
}

/**
 * Invalidate simulation results when user changes configuration inputs.
 */
function handleConfigChange() {
  stopAutoPlay();
  audioTutor.stop();
  appState.simulationResult = null;
  appState.currentStepIndex = -1;
  appState.isCompletedSimulation = false;
  appState.isInspectingHistoricalStep = false;

  dom.btnPrev.disabled = true;
  dom.btnNext.disabled = true;
  dom.btnPlayPause.disabled = true;
  dom.btnRunAll.disabled = true;

  updateAudioTutorUI(audioTutor.getState(), null, 0, false);
}

/**
 * Audio Tutor control handlers
 */
function setupAudioTutorControls() {
  // Voice selection
  if (dom.audioVoiceSelect) {
    dom.audioVoiceSelect.addEventListener('change', (e) => {
      audioTutor.setVoice(e.target.value);
    });
  }

  // Speed selection
  if (dom.audioSpeedSelect) {
    dom.audioSpeedSelect.addEventListener('change', (e) => {
      audioTutor.setRate(e.target.value);
    });
  }

  // Speak explanation button
  if (dom.btnAudioSpeak) {
    dom.btnAudioSpeak.addEventListener('click', () => {
      if (!appState.simulationResult || appState.currentStepIndex < 0) return;
      const step = appState.simulationResult.steps[appState.currentStepIndex];
      if (step) {
        audioTutor.speak(step.audioNarration || step.explanation, { stepIndex: appState.currentStepIndex });
      }
    });
  }

  // Pause / Resume narration button
  if (dom.btnAudioPauseResume) {
    dom.btnAudioPauseResume.addEventListener('click', () => {
      if (audioTutor.status === 'paused') {
        audioTutor.resume();
      } else if (audioTutor.status === 'speaking') {
        audioTutor.pause();
      }
    });
  }

  // Stop narration button
  if (dom.btnAudioStop) {
    dom.btnAudioStop.addEventListener('click', () => {
      audioTutor.stop();
      if (appState.isPlaying) {
        stopAutoPlay();
      }
    });
  }

  // Replay explanation button
  if (dom.btnAudioReplay) {
    dom.btnAudioReplay.addEventListener('click', () => {
      audioTutor.replay();
    });
  }

  // Mute / Unmute button
  if (dom.btnAudioMute) {
    dom.btnAudioMute.addEventListener('click', () => {
      audioTutor.toggleMute();
    });
  }

  // Narrate All Steps button
  if (dom.btnAudioNarrateAll) {
    dom.btnAudioNarrateAll.addEventListener('click', () => {
      if (audioTutor.isNarratingAll) {
        audioTutor.stop();
        return;
      }

      if (!appState.simulationResult || !appState.simulationResult.steps.length) return;

      stopAutoPlay();
      const steps = appState.simulationResult.steps;

      audioTutor.narrateAll(
        steps,
        (idx, currentStep) => {
          // Highlight current narrated step in UI without visual re-animation
          appState.currentStepIndex = idx;
          appState.isInspectingHistoricalStep = true;
          updateStepView({ speak: false, isHistorical: true });
        },
        () => {
          // Complete
          appState.isInspectingHistoricalStep = false;
          if (appState.simulationResult) {
            appState.currentStepIndex = appState.simulationResult.steps.length - 1;
            updateStepView({ speak: false });
          }
        }
      );
    });
  }

  // Subscribe to AudioTutor state updates to keep buttons and badges in sync
  audioTutor.subscribe((state) => {
    const steps = appState.simulationResult ? appState.simulationResult.steps : [];
    const currentStep = (steps && appState.currentStepIndex >= 0) ? steps[appState.currentStepIndex] : null;
    updateAudioTutorUI(state, currentStep, steps ? steps.length : 0, appState.isInspectingHistoricalStep);
  });
}

/**
 * Sets up all event listeners on DOM ready.
 */
function initializeApp() {
  cacheDOMElements();
  detectBackend();
  setupAudioTutorControls();

  dom.btnStart.addEventListener('click', handleStartSimulation);
  dom.btnPrev.addEventListener('click', handlePrevStep);
  dom.btnNext.addEventListener('click', handleNextStep);
  dom.btnPlayPause.addEventListener('click', handlePlayPause);
  dom.btnRunAll.addEventListener('click', handleRunAll);
  dom.btnReset.addEventListener('click', handleReset);

  // Configuration change listeners to invalidate stale data
  dom.referenceInput.addEventListener('input', handleConfigChange);
  dom.frameCountSelect.addEventListener('change', handleConfigChange);
  dom.algorithmSelect.addEventListener('change', handleConfigChange);
}

// Bootstrap once DOM content is parsed (Browser runtime)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}
