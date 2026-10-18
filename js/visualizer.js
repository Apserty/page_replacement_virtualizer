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
 * @param {HTMLElement} container - The DOM container for frames.
 * @param {number} frameCount - Total physical frame slots.
 * @param {Array<number|null>} frames - Current contents of frames.
 * @param {Object|null} highlightInfo - Info about recent hit/fault/replacement.
 * @param {Object|null} matrixData - Full timeline data { referenceString, steps, currentStepIndex }
 */
export function renderMemoryFrames(container, frameCount, frames = [], highlightInfo = null, matrixData = null) {
  if (!container) return;

  // When timeline matrixData is provided, render the full 2D timeline matrix
  if (matrixData && matrixData.referenceString && matrixData.referenceString.length > 0) {
    const { referenceString, steps = [], currentStepIndex = -1 } = matrixData;

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

    // Frame slots F0, F1, F2... (White rounded blocks matching screenshot)
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
      if (c === currentStepIndex) {
        col.classList.add('matrix-col-active');
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

      const hasStepData = c <= currentStepIndex && steps[c];
      const step = hasStepData ? steps[c] : null;

      // Frame rows (Frame 0 to Frame N-1)
      for (let f = 0; f < frameCount; f++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';

        if (step && step.frames && step.frames[f] !== null && step.frames[f] !== undefined) {
          const val = step.frames[f];
          cell.textContent = val;

          // Color classification matching user screenshot
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
 * Displays the explanation log for the current step.
 * 
 * @param {HTMLElement} container - The explanation DOM element.
 * @param {string} text - Explanation description.
 * @param {boolean|null} isHit - Whether current step is a hit or fault.
 */
export function renderExplanation(container, text, isHit = null) {
  if (!container) return;
  if (!text) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">No active step loaded</div>
        <div class="empty-state-subtext">Decision details will display here as you navigate through each step of the simulation.</div>
      </div>
    `;
    return;
  }

  const badge = isHit === true 
    ? `<span class="badge-hit">PAGE HIT</span>` 
    : isHit === false 
      ? `<span class="badge-fault">PAGE FAULT</span>` 
      : '';

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
      ${badge}
      <span style="font-weight: 600; color: var(--text-navy-900);">Step Detail</span>
    </div>
    <p style="color: var(--text-navy-700); line-height: 1.6;">${text}</p>
  `;
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
        <div class="empty-state-subtext">Decision details will display here as you navigate through each step of the simulation.</div>
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
