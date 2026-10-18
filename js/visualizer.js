/**
 * Visualizer Module - DOM Rendering & Visual State Management
 * 
 * Part of "The Hyper-Visual Virtual Memory & Page Replacement Virtualizer"
 * Principles of Operating Systems Project
 */

/**
 * Renders the reference string stream as an interactive sequence of badges/pills.
 * 
 * @param {HTMLElement} container - The DOM container for the reference sequence.
 * @param {number[]} referenceString - Array of page numbers.
 * @param {number} currentStepIndex - The current active step index (-1 if before start).
 */
export function renderReferenceStream(container, referenceString, currentStepIndex = -1) {
  if (!container) return;
  if (!referenceString || referenceString.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">No reference string provided</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  const listEl = document.createElement('div');
  listEl.style.display = 'flex';
  listEl.style.gap = '0.5rem';
  listEl.style.alignItems = 'center';
  listEl.style.flexWrap = 'nowrap';

  referenceString.forEach((page, index) => {
    const item = document.createElement('div');
    item.dataset.index = index;
    item.textContent = page;
    item.style.padding = '0.5rem 0.85rem';
    item.style.borderRadius = '8px';
    item.style.fontWeight = '700';
    item.style.fontSize = '0.95rem';
    item.style.fontFamily = 'var(--font-mono)';
    item.style.transition = 'all 0.2s ease-in-out';
    item.style.border = '1px solid var(--border-color)';
    item.style.minWidth = '38px';
    item.style.textAlign = 'center';

    if (index === currentStepIndex) {
      item.style.backgroundColor = 'var(--color-blue-primary)';
      item.style.color = '#ffffff';
      item.style.borderColor = 'var(--color-blue-hover)';
      item.style.transform = 'scale(1.15)';
      item.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
    } else if (index < currentStepIndex) {
      item.style.backgroundColor = '#e2e8f0';
      item.style.color = '#475569';
    } else {
      item.style.backgroundColor = '#ffffff';
      item.style.color = 'var(--text-navy-900)';
    }

    listEl.appendChild(item);
  });

  container.appendChild(listEl);

  // Scroll active item into view if necessary
  const activeItem = listEl.children[currentStepIndex];
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

/**
 * Renders the physical memory frames as a 2D timeline matrix matching the textbook / user format.
 * - Title: Memory Frames
 * - Left sticky column: White header blocks for F0, F1, F2...
 * - Top header row: Reference string page numbers
 * - Matrix cells:
 *     Green: Page Hit OR Initial Frame Fill
 *     Orange/Amber: Page Fault with Replacement (Eviction)
 *     Dark: Resident page unchanged at this step
 *     Empty/Black: Unallocated slot
 * - Bottom row: Hit / Fault status badges
 * 
 * Supports interactive inspection: clicking any historical step highlights that step
 * and displays its explanation and audio narration independently.
 * 
 * @param {HTMLElement} container - The DOM container for frames.
 * @param {number} frameCount - Total physical frame slots.
 * @param {Array<number|null>} frames - Current contents of frames.
 * @param {Object|null} highlightInfo - Info about recent hit/fault/replacement.
 * @param {Object|null} matrixData - Full timeline data { referenceString, steps, currentStepIndex, onStepClick }
 */
export function renderMemoryFrames(container, frameCount, frames = [], highlightInfo = null, matrixData = null) {
  if (!container) return;

  // When timeline matrixData is provided, render the full 2D timeline matrix
  if (matrixData && matrixData.referenceString && matrixData.referenceString.length > 0) {
    const { referenceString, steps = [], currentStepIndex = -1, onStepClick = null } = matrixData;

    container.innerHTML = `
      <div class="matrix-title">Memory Frames</div>
      <div class="matrix-scroll-wrapper">
        <div class="matrix-grid" id="memory-frames-matrix-grid"></div>
      </div>
      <div class="matrix-legend">
        <div class="legend-item">
          <div class="legend-swatch" style="background-color: #16a34a;"></div>
          <span>Page Hit / Initial Load</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background-color: #d97706;"></div>
          <span>Page Fault (Replacement)</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background-color: #111827; border: 1px solid #1e293b;"></div>
          <span>Resident (Unchanged)</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch" style="background-color: #050811; border: 1px solid #131d33;"></div>
          <span>Empty Slot</span>
        </div>
      </div>
    `;

    const grid = container.querySelector('#memory-frames-matrix-grid');

    // 1. Left sticky frame labels column
    const headerCol = document.createElement('div');
    headerCol.className = 'matrix-header-col';

    // Top ref row label
    const topRefHeader = document.createElement('div');
    topRefHeader.className = 'matrix-ref-cell';
    topRefHeader.style.color = '#38bdf8';
    topRefHeader.style.backgroundColor = 'transparent';
    topRefHeader.style.border = 'none';
    topRefHeader.textContent = 'Ref';
    headerCol.appendChild(topRefHeader);

    // Frame slots F0, F1, F2... (White rounded blocks)
    for (let f = 0; f < frameCount; f++) {
      const headerCell = document.createElement('div');
      headerCell.className = 'matrix-header-cell';
      headerCell.textContent = `F${f}`;
      headerCol.appendChild(headerCell);
    }

    // Bottom status label
    const statusHeader = document.createElement('div');
    statusHeader.className = 'matrix-status-cell';
    statusHeader.style.color = '#94a3b8';
    statusHeader.style.fontWeight = '600';
    statusHeader.textContent = 'Status';
    headerCol.appendChild(statusHeader);

    grid.appendChild(headerCol);

    // 2. Timeline step columns for each referenced page
    referenceString.forEach((page, c) => {
      const col = document.createElement('div');
      col.className = 'matrix-col';
      col.dataset.stepIndex = c;
      col.setAttribute('role', 'button');
      col.setAttribute('tabindex', '0');
      col.setAttribute('title', `Click to inspect Step ${c + 1}: Page ${page}`);

      if (c === currentStepIndex) {
        col.classList.add('matrix-col-active');
      }

      // Click / Keyboard handler to inspect historical step
      if (onStepClick && steps[c]) {
        col.addEventListener('click', () => onStepClick(c));
        col.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onStepClick(c);
          }
        });
      }

      // Top reference request badge
      const refCell = document.createElement('div');
      refCell.className = 'matrix-ref-cell';
      refCell.textContent = page;
      if (c === currentStepIndex) {
        refCell.style.color = '#ffffff';
        refCell.style.backgroundColor = '#2563eb';
        refCell.style.borderColor = '#38bdf8';
        refCell.style.boxShadow = '0 0 6px rgba(56, 189, 248, 0.5)';
      }
      col.appendChild(refCell);

      const hasStepData = steps[c] !== undefined && steps[c] !== null;
      // If we are navigating sequentially and step has been reached
      const isReached = c <= currentStepIndex || (matrixData.isCompleted && hasStepData);
      const step = isReached && hasStepData ? steps[c] : null;

      // Frame rows (Frame 0 to Frame N-1)
      for (let f = 0; f < frameCount; f++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';

        if (step && step.frames && step.frames[f] !== null && step.frames[f] !== undefined) {
          const val = step.frames[f];
          cell.textContent = val;

          // Color classification
          if (step.victimFrameIndex === f) {
            if (step.isHit) {
              cell.classList.add('matrix-cell-green'); // Page Hit
            } else if (step.victimPage !== null) {
              cell.classList.add('matrix-cell-orange'); // Page Fault with eviction replacement
            } else {
              cell.classList.add('matrix-cell-green'); // Page Fault initial allocation into empty frame
            }
          } else {
            cell.classList.add('matrix-cell-dark'); // Resident unchanged page
          }
        } else {
          cell.classList.add('matrix-cell-empty');
        }

        col.appendChild(cell);
      }

      // Bottom status cell
      const statCell = document.createElement('div');
      statCell.className = 'matrix-status-cell';
      if (step) {
        if (step.isHit) {
          statCell.classList.add('matrix-status-hit');
          statCell.textContent = 'HIT';
        } else {
          statCell.classList.add('matrix-status-fault');
          statCell.textContent = 'FAULT';
        }
      } else {
        statCell.style.opacity = '0.2';
        statCell.textContent = '—';
      }
      col.appendChild(statCell);

      grid.appendChild(col);
    });

    // Auto-scroll active column into view smoothly
    const activeCol = grid.children[currentStepIndex + 1];
    if (activeCol) {
      activeCol.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    return;
  }

  // Fallback initial empty display
  container.innerHTML = `
    <div class="empty-state">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><line x1="12" y1="4" x2="12" y2="20"></line></svg>
      <div class="empty-state-text" style="color: #94a3b8;">Memory Frames Unallocated</div>
      <div class="empty-state-subtext" style="color: #64748b;">Configure parameters and click "Start Simulation" to view the Memory Frames matrix.</div>
    </div>
  `;
}

/**
 * Updates statistical metrics counters in the DOM.
 * 
 * @param {Object} stats
 * @param {number|string} stats.totalRequests
 * @param {number|string} stats.hits
 * @param {number|string} stats.faults
 * @param {number|string} stats.hitRatio
 * @param {number|string} stats.faultRatio
 * @param {string} stats.stepProgress
 */
export function renderStatistics(stats) {
  const totalEl = document.getElementById('stat-total-requests');
  const hitsEl = document.getElementById('stat-hits');
  const faultsEl = document.getElementById('stat-faults');
  const hitRatioEl = document.getElementById('stat-hit-ratio');
  const faultRatioEl = document.getElementById('stat-fault-ratio');
  const stepEl = document.getElementById('stat-current-step');

  if (totalEl) totalEl.textContent = stats.totalRequests ?? '--';
  if (hitsEl) hitsEl.textContent = stats.hits ?? '--';
  if (faultsEl) faultsEl.textContent = stats.faults ?? '--';
  if (hitRatioEl) hitRatioEl.textContent = stats.hitRatio !== undefined ? `${stats.hitRatio}%` : '--%';
  if (faultRatioEl) faultRatioEl.textContent = stats.faultRatio !== undefined ? `${stats.faultRatio}%` : '--%';
  if (stepEl) stepEl.textContent = stats.stepProgress ?? '0 / 0';
}

/**
 * Displays the complete pedagogical explanation for a simulation step.
 * 
 * @param {HTMLElement} container - The explanation DOM element.
 * @param {string|Object} stepOrText - Step object or explanation text.
 * @param {boolean|null} [isHit] - Whether step is hit or fault (if string passed).
 * @param {Object} [options] - Additional rendering options { isHistorical, title }.
 */
export function renderExplanation(container, stepOrText, isHit = null, options = {}) {
  if (!container) return;

  if (!stepOrText) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">No active step loaded</div>
        <div class="empty-state-subtext">Decision details and spoken explanations will display here as you navigate through each step.</div>
      </div>
    `;
    return;
  }

  let text = '';
  let hitStatus = isHit;
  let title = options.title || 'Step Detail';
  let stepTitle = '';
  let displayHtml = '';
  let badgeClass = 'badge-neutral';
  let isHistorical = !!options.isHistorical;

  if (typeof stepOrText === 'object') {
    const step = stepOrText;
    text = step.explanation || step.reason || '';
    displayHtml = step.displayHtml || '';
    hitStatus = step.isHit;
    title = step.eventTypeTitle || step.title || (step.isHit ? 'PAGE HIT' : (step.victimPage !== null ? 'PAGE FAULT — PAGE REPLACEMENT REQUIRED' : 'PAGE FAULT — EMPTY FRAME AVAILABLE'));
    stepTitle = step.stepTitle || `Step ${step.stepIndex + 1}`;
  } else {
    text = stepOrText;
  }

  if (hitStatus === true) {
    badgeClass = 'badge-hit';
  } else if (hitStatus === false) {
    badgeClass = 'badge-fault';
  }

  const historicalNotice = isHistorical 
    ? `<span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 600;">Inspecting Historical Step</span>` 
    : '';

  const headerHtml = `
    <div class="explanation-card-header">
      <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
        ${stepTitle ? `<span class="step-title-text">${stepTitle}</span>` : ''}
        <span class="${badgeClass}">${title}</span>
        ${historicalNotice}
      </div>
    </div>
  `;

  if (displayHtml) {
    container.innerHTML = headerHtml + displayHtml;
  } else {
    container.innerHTML = `
      ${headerHtml}
      <p style="color: var(--text-navy-800); line-height: 1.65; font-size: 0.9rem; margin-bottom: 0.5rem;">${text}</p>
    `;
  }
}

/**
 * Updates the Audio Tutor UI status badge, controls, and selectors.
 * 
 * @param {Object} audioState - State from AudioTutor
 * @param {Object|null} currentStep - Current step data if available
 * @param {number} totalSteps - Total steps in sequence
 * @param {boolean} isHistorical - True if user is inspecting a step independently
 */
export function updateAudioTutorUI(audioState, currentStep = null, totalSteps = 0, isHistorical = false) {
  const statusBadge = document.getElementById('audio-tutor-status-badge');
  const statusText = document.getElementById('audio-tutor-status-text');
  const eventBadge = document.getElementById('audio-event-badge');
  const stepBadge = document.getElementById('audio-step-badge');
  const voiceSelect = document.getElementById('audio-voice-select');
  const btnSpeak = document.getElementById('btn-audio-speak');
  const btnPauseResume = document.getElementById('btn-audio-pause-resume');
  const btnStop = document.getElementById('btn-audio-stop');
  const btnReplay = document.getElementById('btn-audio-replay');
  const btnMute = document.getElementById('btn-audio-mute');
  const muteText = document.getElementById('audio-mute-text');
  const btnNarrateAll = document.getElementById('btn-audio-narrate-all');

  // 1. Status Badge
  if (statusBadge && statusText) {
    statusBadge.className = 'audio-status-badge';
    if (!audioState.isSupported) {
      statusBadge.classList.add('status-unsupported');
      statusText.textContent = 'Audio Unavailable';
      statusBadge.title = 'Web Speech synthesis is not supported in this browser environment.';
    } else if (audioState.isMuted) {
      statusBadge.classList.add('status-muted');
      statusText.textContent = 'Muted';
    } else if (audioState.isSpeaking) {
      statusBadge.classList.add('status-speaking');
      statusText.textContent = audioState.isNarratingAll ? 'Narrating All...' : 'Speaking...';
    } else if (audioState.isPaused) {
      statusBadge.classList.add('status-paused');
      statusText.textContent = 'Paused';
    } else if (audioState.status === 'stopped') {
      statusBadge.classList.add('status-stopped');
      statusText.textContent = 'Stopped';
    } else {
      statusBadge.classList.add('status-ready');
      statusText.textContent = 'Audio Ready';
    }
  }

  // 2. Event Badge and Step Badge
  if (currentStep) {
    const stepNum = currentStep.stepIndex + 1;
    if (stepBadge) {
      stepBadge.textContent = isHistorical 
        ? `Step ${stepNum} of ${totalSteps} (History)` 
        : `Step ${stepNum} of ${totalSteps}`;
    }

    if (eventBadge) {
      if (currentStep.isHit) {
        eventBadge.className = 'badge-hit';
        eventBadge.textContent = 'PAGE HIT';
      } else if (currentStep.eventType === 'FAULT_INITIAL' || currentStep.victimPage === null) {
        eventBadge.className = 'badge-hit';
        eventBadge.style.backgroundColor = '#ecfdf5';
        eventBadge.style.color = '#065f46';
        eventBadge.textContent = 'PAGE FAULT — EMPTY FRAME AVAILABLE';
      } else {
        eventBadge.className = 'badge-fault';
        eventBadge.textContent = 'PAGE FAULT — PAGE REPLACEMENT REQUIRED';
      }
    }
  } else {
    if (stepBadge) stepBadge.textContent = totalSteps > 0 ? `Step 0 of ${totalSteps}` : 'Step 0 / 0';
    if (eventBadge) {
      eventBadge.className = 'badge-neutral';
      eventBadge.textContent = 'Initial State';
    }
  }

  // 3. Voices selector population
  if (voiceSelect && audioState.voices && audioState.voices.length > 0) {
    // Populate if not yet populated or voice count changed (e.g. async cloud voices arrived)
    if (voiceSelect.options.length <= 1 || voiceSelect.options.length !== audioState.voices.length) {
      voiceSelect.innerHTML = '';
      audioState.voices.forEach((v, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${v.name} (${v.lang})`;
        if (idx === audioState.selectedVoiceIndex) {
          opt.selected = true;
        }
        voiceSelect.appendChild(opt);
      });
      voiceSelect.value = String(audioState.selectedVoiceIndex);
    } else if (voiceSelect.value !== String(audioState.selectedVoiceIndex)) {
      voiceSelect.value = String(audioState.selectedVoiceIndex);
    }
  }

  // 4. Action Buttons State Management
  const hasStep = !!currentStep;
  const isSpeaking = audioState.isSpeaking;
  const isPaused = audioState.isPaused;
  const isSupported = audioState.isSupported;

  if (btnSpeak) btnSpeak.disabled = !hasStep || !isSupported;
  if (btnReplay) btnReplay.disabled = !hasStep || !isSupported;
  if (btnStop) btnStop.disabled = (!isSpeaking && !isPaused) || !isSupported;
  
  if (btnPauseResume) {
    btnPauseResume.disabled = (!isSpeaking && !isPaused) || !isSupported;
    if (isPaused) {
      btnPauseResume.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Resume
      `;
    } else {
      btnPauseResume.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
        Pause
      `;
    }
  }

  if (btnMute && muteText) {
    muteText.textContent = audioState.isMuted ? 'Unmute' : 'Mute';
    if (audioState.isMuted) {
      btnMute.classList.add('btn-primary');
      btnMute.classList.remove('btn-secondary');
    } else {
      btnMute.classList.remove('btn-primary');
      btnMute.classList.add('btn-secondary');
    }
  }

  if (btnNarrateAll) {
    btnNarrateAll.disabled = totalSteps === 0 || !isSupported;
    if (audioState.isNarratingAll) {
      btnNarrateAll.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
        Stop Narrating
      `;
    } else {
      btnNarrateAll.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        Narrate All Steps
      `;
    }
  }
}

/**
 * Resets all visualizer containers to their pristine empty states.
 */
export function resetVisualizer() {
  const streamContainer = document.getElementById('reference-stream-container');
  const framesContainer = document.getElementById('memory-frames-container');
  const explanationContainer = document.getElementById('explanation-container');

  if (streamContainer) {
    streamContainer.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div class="empty-state-text">No active simulation sequence loaded</div>
        <div class="empty-state-subtext">Click "Start Simulation" above to initialize the reference string pipeline.</div>
      </div>
    `;
  }

  if (framesContainer) {
    framesContainer.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><line x1="12" y1="4" x2="12" y2="20"></line></svg>
        <div class="empty-state-text">Memory Frames Unallocated</div>
        <div class="empty-state-subtext">Configure parameters and start simulation to view memory frame slots.</div>
      </div>
    `;
  }

  if (explanationContainer) {
    explanationContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">No active step loaded</div>
        <div class="empty-state-subtext">Decision details and spoken explanations will display here as you navigate through each step.</div>
      </div>
    `;
  }

  renderStatistics({
    totalRequests: '--',
    hits: '--',
    faults: '--',
    hitRatio: undefined,
    faultRatio: undefined,
    stepProgress: '0 / 0'
  });
}
