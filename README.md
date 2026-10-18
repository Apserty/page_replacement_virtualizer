# The Hyper-Visual Virtual Memory & Page Replacement Virtualizer

> An interactive, high-fidelity educational simulation and pedagogical audio platform for Operating Systems. Explores demand paging, memory frames allocation, and page replacement strategies with structured step explanations, speech narration, and real-time performance analytics.

---

## Overview

**The Hyper-Visual Virtual Memory & Page Replacement Virtualizer** is designed to provide computer science students, instructors, and systems engineers with an intuitive, deep-dive understanding of virtual memory management. The platform simulates demand paging across configurable reference sequences and physical memory frame counts, visualizing hit/fault transitions, replacement victims, and cache metrics in real time.

---

## Core Capabilities & Features

### 1. Page Replacement Algorithms
- **FIFO (First-In, First-Out):** Replaces the resident page that arrived earliest in physical memory, managed via an arrival queue.
- **LRU (Least Recently Used):** Replaces the page that has not been referenced for the longest period of time, leveraging access timestamps.
- **Optimal (Belady's Min Algorithm):** Inspects future page requests across the remaining reference sequence to evict the page that will not be used for the longest time (or never again), achieving theoretical minimum fault rates.

### 2. Dark Matrix Memory Visualization
- **Frame-by-Frame Timeline Grid:** Displays the physical memory snapshot for every step in the reference sequence.
- **State Classification:**
  - **Page Hit / Initial Load:** Highlighted in emerald green.
  - **Page Fault (Replacement Required):** Highlighted in amber orange.
  - **Resident (Unchanged):** Displayed in deep dark matrix slots.
- **Interactive Time-Travel Inspection:** Click or navigate to any historical step on the matrix grid to inspect past memory states without corrupting active simulation state.
- **Sticky Slot Headers:** Memory frame indicators (`F0`, `F1`, `F2`...) remain pinned on the left during horizontal scrolling.

### 3. Integrated Audio Tutor
- **Web Speech Synthesis Engine:** Real-time pedagogical audio narration of simulation events.
- **Default Narration Voice:** Prioritizes **Microsoft Neerja Online (Natural) - English (India) (`en-IN`)**, with automatic fallback to natural English voices.
- **Narration Controls:**
  - **Play / Pause / Resume / Stop / Replay:** Granular control over the current step's voice explainer.
  - **Narrate All Steps:** Automated sequential voice walkthrough across the entire reference string.
  - **Speed Selector:** Configurable narration rate (`0.75x`, `0.92x`, `1.0x (Default)`, `1.25x`, `1.5x`).
  - **Interruption Safety:** Handles button clicks, manual stepping, and cancellation without double-stepping or state desynchronization.

### 4. Structured Pedagogical Explanations
Every simulation transition generates a beginner-friendly explanation divided into logical sections:
- **Event Header & Badge:** `PAGE HIT`, `PAGE FAULT — EMPTY FRAME AVAILABLE`, or `PAGE FAULT — PAGE REPLACEMENT REQUIRED`.
- **What Happened?:** Describes CPU reference requests and memory presence.
- **Current Memory State:** Formats pre-event frame contents in clear English.
- **Why Did This Happen?:** Explains the underlying trigger of the hit or fault.
- **Algorithm Decision:** Explains specific replacement criteria (earliest arrival, least recent access, or furthest future reuse).
- **Action Taken:** Details loaded, removed, and resident pages.
- **Updated Memory:** Resulting memory state after the request.
- **Separated Audio Narration:** Conversational, punctuation-safe spoken English (e.g., *"Step 2, Page 0, It is Page Fault Because Empty Frame is available..."*).

### 5. Production Dual-Engine Architecture
- **Backend Mode (Python / Flask):** High-performance simulation server providing REST API endpoints (`/api/simulate`, `/api/step`, `/api/status`).
- **Client-Side Fallback (Vanilla ES6):** In-browser simulation engine providing identical algorithmic accuracy offline without server dependency.
- **Automatic Health Sensing:** The UI continuously monitors and reports connection status via dynamic engine badges.

### 6. Universal Device Responsiveness
- **Cross-Device Optimization:** Full responsiveness across mobile phones (down to 320px), tablets, laptops, and ultra-wide displays.
- **Touch-Friendly Controls:** Optimized touch targets (minimum 42px), momentum horizontal scrolling (`-webkit-overflow-scrolling: touch`), and adaptive toolbar grids.

---

## Production Architecture & System Structure

```
virtual-memory-virtualizer/
├── server.py                 # Production Flask server & API routing
├── algorithms.py             # Python engine (FIFO, LRU, Optimal & explanation generator)
├── index.html                # Semantic, accessible HTML5 dashboard interface
├── css/
│   └── style.css             # Comprehensive design system, dark matrix, and responsive media queries
├── js/
│   ├── app.js                # Application controller, event orchestration, and state machine
│   ├── algorithms.js         # Client-side JavaScript algorithmic simulation engine
│   ├── explanations.js       # Structured explanation cards & natural speech text generator
│   ├── audioTutor.js         # Web Speech API audio controller & voice prioritization
│   └── visualizer.js         # Memory frame matrix renderer, statistics, and DOM binder
├── assets/
│   └── favicon.svg           # High-resolution SVG hardware brand mark
├── tests/
│   └── algorithms.test.js    # Automated 22-test validation suite
└── package.json              # Project metadata and test configuration
```

---

## API Reference (Server Endpoints)

### `GET /api/status`
Health check endpoint reporting backend availability and supported algorithms.

**Response:**
```json
{
  "status": "online",
  "backend": "Python Flask",
  "supportedAlgorithms": ["FIFO", "LRU", "OPTIMAL"]
}
```

### `POST /api/simulate`
Executes full page replacement simulation for a given configuration.

**Request Payload:**
```json
{
  "algorithm": "FIFO",
  "referenceString": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2],
  "frameCount": 3
}
```

**Response Payload:**
```json
{
  "algorithm": "FIFO",
  "referenceString": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2],
  "frameCount": 3,
  "totalRequests": 13,
  "totalHits": 3,
  "totalFaults": 10,
  "hitRatio": 23.08,
  "faultRatio": 76.92,
  "steps": [ ... ]
}
```

---

## Quality Assurance & Verification

The platform includes an automated regression test suite ensuring complete mathematical and behavioral parity across both Python and JavaScript implementations:

```
Test Suites:
  [✓] Module structure & export interface integrity
  [✓] Input parser delimiters (commas, spaces, semicolons, invalid tokens)
  [✓] Benchmark verification on standard reference strings (FIFO, LRU, Optimal)
  [✓] Immediate hit, initial load, and eviction edge cases
  [✓] 8-Section explanation structure & audio narration formatting
  [✓] Audio Tutor voice prioritization (Microsoft Neerja / en-IN priority)
  [✓] Deterministic step history & single-frame boundaries

Results: 22 passed | 0 failed
```

---

## System Requirements

- **Client Runtime:** Modern web browser supporting ES6 Modules and the Web Speech API (Chrome, Edge, Safari, Firefox).
- **Server Runtime:** Python 3.10+ with Flask (for backend API mode), or static web hosting for standalone client mode.

---

## License

Developed for educational and academic instructional use in Principles of Operating Systems coursework.
