# Architecture, Working Mechanism, and Complete File-by-File Analysis

> **Project Name:** The Hyper-Visual Virtual Memory & Page Replacement Virtualizer  
> **Domain:** Operating Systems — Virtual Memory Management & Demand Paging Simulation  
> **Document Purpose:** Comprehensive technical breakdown of the system pipelining, data flows, and an exhaustive file-by-file analysis explaining the exact reason and inner workings of every single file in the repository.

---

## Table of Contents
1. [System Overview & High-Level Architecture](#1-system-overview--high-level-architecture)
2. [End-to-End Pipelining: How It Works](#2-end-to-end-pipelining-how-it-works)
   - [Phase 1: Input Parsing and Validation Pipeline](#phase-1-input-parsing-and-validation-pipeline)
   - [Phase 2: Backend Detection and Engine Negotiation](#phase-2-backend-detection-and-engine-negotiation)
   - [Phase 3: Algorithmic Simulation Pipeline (FIFO, LRU, Optimal)](#phase-3-algorithmic-simulation-pipeline-fifo-lru-optimal)
   - [Phase 4: Structured Pedagogical & Audio Narration Generation](#phase-4-structured-pedagogical--audio-narration-generation)
   - [Phase 5: Matrix Rendering and Visual State Updates](#phase-5-matrix-rendering-and-visual-state-updates)
   - [Phase 6: Audio Tutor Speech Synthesis Pipeline](#phase-6-audio-tutor-speech-synthesis-pipeline)
   - [Phase 7: Time-Travel and User Interaction Pipeline](#phase-7-time-travel-and-user-interaction-pipeline)
3. [Exhaustive File-by-File Analysis](#3-exhaustive-file-by-file-analysis)
   - [Root Configuration & Documentation](#root-configuration--documentation)
     - [`README.md`](#readmemd)
     - [`package.json`](#packagejson)
     - [`pyproject.toml`](#pyprojecttoml)
     - [`.gitignore`](#gitignore)
   - [Backend & Server Layer (Python)](#backend--server-layer-python)
     - [`server.py`](#serverpy)
     - [`algorithms.py`](#algorithmspy)
     - [`main.py`](#mainpy)
     - [`endpoints/__init__.py`](#endpoints__init__py)
     - [`endpoints/routes.py`](#endpointsroutespy)
   - [Frontend Presentation Layer](#frontend-presentation-layer)
     - [`index.html`](#indexhtml)
     - [`css/style.css`](#cssstylecss)
   - [Frontend Application & Logic Layer (JavaScript)](#frontend-application--logic-layer-javascript)
     - [`js/app.js`](#jsappjs)
     - [`js/algorithms.js`](#jsalgorithmsjs)
     - [`js/explanations.js`](#jsexplanationsjs)
     - [`js/audioTutor.js`](#jsaudiotutorjs)
     - [`js/visualizer.js`](#jsvisualizerjs)
   - [Automated Testing & Verification](#automated-testing--verification)
     - [`tests/algorithms.test.js`](#testsalgorithmstestjs)
   - [Assets & Static Media](#assets--static-media)
     - [`assets/favicon.svg`](#assetsfaviconsvg)
     - [`public/favicon.ico`](#publicfaviconico)
     - [`assets/FIFO.mp4`](#assetsfifomp4)
     - [`assets/LRU.mp4`](#assetslrump4)
     - [`assets/OPTIMAL.mp4`](#assetsoptimalmp4)
4. [Data Contracts and Parity Validation](#4-data-contracts-and-parity-validation)

---

## 1. System Overview & High-Level Architecture

The **Hyper-Visual Virtual Memory & Page Replacement Virtualizer** is an interactive, educational platform designed to simulate how modern Operating Systems handle **demand paging**, **page faults**, and **physical frame replacements**.

The application is engineered using a **Dual-Engine Architecture**:
1. **Server-Side Engine (Python / Flask):** A standalone microservice running an algorithmic engine (`algorithms.py`) exposed via REST API (`server.py`). It calculates exact memory transitions, hit/fault ratios, and structured explanations.
2. **Client-Side Engine (Vanilla ES6 JavaScript):** An autonomous browser-based simulation engine (`js/algorithms.js` and `js/explanations.js`) with complete algorithmic and mathematical parity to the Python engine. If the Python server is offline, the web application runs without disruption.

```
                              ┌──────────────────────────────────────────┐
                              │            User Browser Client           │
                              │        (index.html + css/style.css)      │
                              └────────────────────┬─────────────────────┘
                                                   │ User Input / Controls
                                                   ▼
                                      ┌────────────────────────┐
                                      │       js/app.js        │
                                      │ (Controller & State)   │
                                      └───────┬────────┬───────┘
                                              │        │
                   Backend Health Check (OK)? │        │ Fallback / Standalone
                                              ▼        ▼
┌──────────────────────────────────────────────┐      ┌───────────────────────────────────┐
│           Python Flask Backend               │      │      Client-Side Engine (JS)      │
│  - server.py (REST API /api/simulate)        │      │  - js/algorithms.js               │
│  - algorithms.py (FIFO, LRU, Optimal Engine) │      │  - js/explanations.js             │
└──────────────────────┬───────────────────────┘      └─────────────────┬─────────────────┘
                       │                                                │
                       └───────────────────────┬────────────────────────┘
                                               │ Standardized Simulation Result JSON
                                               ▼
                                  ┌────────────────────────┐
                                  │   Update State Model   │
                                  └───────┬────────┬───────┘
                                          │        │
                       DOM Matrix Update  │        │ Voice Audio Synthesizer
                                          ▼        ▼
             ┌──────────────────────────────┐    ┌────────────────────────────────────────┐
             │       js/visualizer.js       │    │           js/audioTutor.js             │
             │ - Dark Matrix Frames Grid    │    │ - Web Speech API                       │
             │ - Reference Stream Badges    │    │ - Priority: Microsoft Neerja (en-IN)   │
             │ - Real-Time Stats & Counters │    │ - Speech Rate, Pitch, Mute, Play/Pause │
             │ - 6-Section Explanation Card │    │ - Step-synchronized narration         │
             └──────────────────────────────┘    └────────────────────────────────────────┘
```

---

## 2. End-to-End Pipelining: How It Works

### Phase 1: Input Parsing and Validation Pipeline
1. The user inputs a reference sequence into the text field (e.g. `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2`), picks a physical frame capacity (1 to 7 frames), and selects an algorithm (`FIFO`, `LRU`, or `OPTIMAL`).
2. When the user clicks **Start Simulation** or hits Enter, `js/app.js` captures the event.
3. The parser function `parseReferenceString(rawString)` processes the input:
   - Uses regex `/[\s,;]+/` to split input across spaces, commas, or semicolons.
   - Trims whitespace and strips empty tokens.
   - Validates that each item is a non-negative integer. If an invalid character or negative number is present, it throws a descriptive error and displays an alert without corrupting state.

### Phase 2: Backend Detection and Engine Negotiation
1. Upon initial load, `js/app.js` runs `detectBackend()`, pinging `GET /api/status`.
2. If `server.py` responds with `{"status": "online", "backend": "Python Flask"}`, the app sets `appState.hasBackend = true` and shows a green "Python Backend Connected" badge in the header.
3. If the server is offline or unreachable, `appState.hasBackend` defaults to `false`, and the badge indicates "Client Engine Active".
4. When `executeSimulation()` is triggered:
   - If backend is active: It sends a `POST` request to `/api/simulate` with `{ algorithm, referenceString, frameCount }`.
   - If backend fails or is inactive: It seamlessly calls `runPageReplacement(algorithm, referenceString, frameCount)` in `js/algorithms.js`.
5. Both engines return the exact same JSON schema containing cumulative metrics and step-by-step state arrays.

### Phase 3: Algorithmic Simulation Pipeline (FIFO, LRU, Optimal)
For each page reference in the sequence, the engine conducts the following pipeline:
1. **Frame State Inspection:** Checks if the requested page already resides in the allocated frames (`frames.indexOf(page) !== -1`).
   - **Case A: Page Hit (`isHit = true`):**
     - Increment `totalHits`.
     - Frame slots remain unaltered.
     - In **LRU**, the last-used timestamp/step index for this page is updated to the current step index.
     - In **FIFO**, arrival queue order remains untouched.
   - **Case B: Page Fault with Empty Frame Available (`eventType = "FAULT_INITIAL"`):**
     - Increment `totalFaults`.
     - First empty slot (`None` or `null`) is allocated with the requested page.
     - In **FIFO**, the frame slot index is appended to the FIFO queue.
     - In **LRU**, the page's last accessed step is logged.
   - **Case C: Page Fault Requiring Eviction (`eventType = "FAULT_REPLACE"`):**
     - Increment `totalFaults`.
     - Evaluates eviction victim based on the active policy:
       - **FIFO:** The frame at the head of the arrival queue (`fifoQueue.shift()`) is chosen. The new page replaces the victim in that slot, and the slot is re-enqueued at the back.
       - **LRU:** Scans resident pages to find the frame whose page has the smallest (oldest) access step in `last_used`.
       - **Optimal:** Looks forward into the remaining reference sequence (`k > stepIndex`). For each resident page, it finds the index of its next occurrence. The page with the furthest future reference (or one that is never used again) is selected. Ties are broken deterministically using the lowest frame index.

### Phase 4: Structured Pedagogical & Audio Narration Generation
For every step, the explanation generator (`generate_step_explanation` in Python or `generateStepExplanation` in JS) constructs an 8-section pedagogical analysis:
- **Section A (Step Title & Badge):** Header stating step number, page number, and event badge (`PAGE HIT`, `PAGE FAULT — EMPTY FRAME AVAILABLE`, or `PAGE FAULT — PAGE REPLACEMENT REQUIRED`).
- **Section B (What Happened?):** Identifies whether the CPU found the page in physical RAM or had to initiate a disk read.
- **Section C (Current Memory State):** Natural English description of frames before the reference (e.g., *"Frame 0 contains page 7, Frame 1 is empty, and Frame 2 contains page 1"*).
- **Section D (Why Did This Happen?):** Root cause analysis of why a hit or fault occurred.
- **Section E (Algorithm Decision):** Why this specific frame/victim was picked under FIFO arrival queues, LRU timestamps, or Belady's future lookahead.
- **Section F (Action Taken):** Which frame was updated or which victim page was evicted.
- **Section G (Updated Memory):** Natural English description of the resulting memory state.
- **Section H (Running Statistics):** Cumulative requests, hits, faults, and hit/fault percentages rounded to 2 decimal places.
- **Separated Audio Narration Script:** A punctuation-safe, conversational string written for natural voice delivery (e.g., *"Step 2, Page 0, It is Page Fault Because Empty Frame is available. The CPU requested page 0..."*).

### Phase 5: Matrix Rendering and Visual State Updates
When a simulation step is activated, `js/visualizer.js` updates the user interface:
1. **Reference Stream Pipeline:** Renders each page badge horizontally. The active page is highlighted in vibrant blue, scaled by `1.15x`, and scrolled into view automatically. Historical pages turn muted slate; future pages remain white.
2. **Dark Matrix Timeline Grid:** Renders a 2D matrix matching OS textbook format:
   - Sticky left header column lists frame slots (`F0`, `F1`, `F2`...).
   - Horizontal top row shows the reference sequence.
   - Cells are styled by event:
     - **Emerald Green:** Page Hit or Initial Frame Fill.
     - **Amber / Orange:** Eviction with Page Replacement.
     - **Dark Navy/Black:** Resident page remaining unchanged.
     - **Deep Hollow Black:** Unallocated frame slot.
   - Sticky bottom row shows `HIT` (green) or `FAULT` (red) status pills.
3. **Statistics Dashboard:** Updates Total Requests, Page Hits, Page Faults, Hit Ratio (%), Fault Ratio (%), and Step Progress counters.
4. **Pedagogical Explanation Card:** Injects the 6 formatted HTML breakdown cards into the DOM.

### Phase 6: Audio Tutor Speech Synthesis Pipeline
`js/audioTutor.js` interfaces directly with the browser's `window.speechSynthesis` API:
1. **Voice Discovery & Selection:** Asynchronously queries browser speech engines. It searches through installed voices using a strict priority ladder:
   - Priority 1: `Microsoft Neerja Online (Natural) - English (India)` (`en-IN`).
   - Priority 2: Any other `en-IN` voice.
   - Priority 3: Natural/Neural English voices (`en-US`, `en-GB`, Google, Samantha, Daniel).
   - Priority 4: Standard default English voices.
2. **Narration Execution:** When stepping through the simulation, `audioTutor.speak(audioNarration)` synthesizes speech using the user's selected speed (`0.75x` to `1.5x`).
3. **Sequential Auto-Play Coordination:**
   - In "Play" mode, the system speaks the current step explanation.
   - The `onEnd` callback of the `SpeechSynthesisUtterance` fires once speech finishes.
   - A 500ms pedagogical pause elapses, and the app automatically steps to the next reference.
   - If audio is muted or unsupported, it falls back to a timer-driven delay (`playbackBaseIntervalMs = 1200ms`).

### Phase 7: Time-Travel and User Interaction Pipeline
1. The user can click any column in the Dark Matrix timeline at any time.
2. `handleHistoricalStepClick(stepIndex)` pauses auto-play, stops speech, sets `isInspectingHistoricalStep = true`, and renders the historical frame state, stats, and explanation for that exact step without resetting the active simulation progress.
3. Dedicated buttons allow stepping forward (`Next Step`), backward (`Previous Step`), running to the end (`Run Complete Simulation`), or reading the entire sequence sequentially (`Narrate All Steps`).

---

## 3. Exhaustive File-by-File Analysis

Every file in the repository serves a specific architectural role. Below is an exhaustive breakdown of every file, detailing why it exists, how it works, and its interactions with other modules.

```
virtual-memory-virtualizer/
├── .gitignore
├── README.md
├── package.json
├── pyproject.toml
├── server.py
├── algorithms.py
├── main.py
├── endpoints/
│   ├── __init__.py
│   └── routes.py
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── algorithms.js
│   ├── explanations.js
│   ├── audioTutor.js
│   └── visualizer.js
├── tests/
│   └── algorithms.test.js
├── assets/
│   ├── favicon.svg
│   ├── FIFO.mp4
│   ├── LRU.mp4
│   └── OPTIMAL.mp4
└── public/
    └── favicon.ico
```

---

### Root Configuration & Documentation

#### `README.md`
- **Reason for Existence:** Serves as the primary documentation and user guide for the repository. It communicates project capabilities, educational objectives, feature breakdowns, architecture diagrams, API specifications, and testing benchmarks.
- **Detailed Working:** 
  - Written in GitHub-flavored Markdown.
  - Documents the 3 replacement algorithms (FIFO, LRU, Optimal).
  - Outlines the Dark Matrix visual layout and color coding.
  - Details the Audio Tutor features and default voice priority (`Microsoft Neerja en-IN`).
  - Provides REST API curl examples for `/api/status` and `/api/simulate`.
  - Lists the 22 automated regression test criteria.

#### `package.json`
- **Reason for Existence:** Declares Node.js module configuration and project scripts for local development and test execution.
- **Detailed Working:**
  - Configures `"type": "module"`, allowing the project and tests to use modern ES6 JavaScript module imports/exports (`import ... from '...'`) natively in Node.js without requiring Babel or Webpack.
  - Defines the test script `"scripts": { "test": "node tests/algorithms.test.js" }`, which enables single-command execution of the 22-test automated regression suite via `npm test`.

#### `pyproject.toml`
- **Reason for Existence:** Modern Python packaging standard (PEP 517/518/621) defining project metadata and Python dependencies.
- **Detailed Working:**
  - Declares minimum Python version `requires-python = ">=3.9"`.
  - Defines server dependencies: `flask>=3.1,<4.0` (lightweight WSGI web server framework) and `gunicorn~=23.0.0` (production UNIX WSGI HTTP server).
  - Enables easy installation using `pip install .` or modern dependency managers like `uv` or `poetry`.

#### `.gitignore`
- **Reason for Existence:** Prevents temporary, environment-specific, or auto-generated files from being checked into the Git version control repository.
- **Detailed Working:**
  - Ignores Python bytecode and cache files (`__pycache__`, `*.pyc`).
  - Ignores virtual environment folders (`.venv`, `venv`, `env`).
  - Ignores cloud deployment artifacts (`.vercel`).
  - Ignores server log files (`*.log`).

---

### Backend & Server Layer (Python)

#### `server.py`
- **Reason for Existence:** The production Flask application server providing the REST API for algorithmic simulation and acting as the static file web server.
- **Detailed Working:**
  - **CORS & Cache Control:** Configures `@app.after_request` to add `Access-Control-Allow-Origin: *` headers, ensuring the web interface can communicate with the backend across domains, and disables HTTP caching during active development.
  - **Health Check Endpoint (`GET /api/status`):** Returns `{ "status": "online", "backend": "Python Flask", "supportedAlgorithms": ["FIFO", "LRU", "OPTIMAL"] }` so the frontend can automatically detect backend availability.
  - **Simulation API Endpoint (`GET` / `POST /api/simulate`):**
    - Parses input parameters: `algorithm`, `referenceString`, and `frameCount`.
    - Handles JSON request bodies as well as query string fallbacks (`?algorithm=...&reference=...&frames=...`).
    - Validates inputs (non-empty list of page numbers, `frameCount >= 1`).
    - Calls `run_page_replacement(algorithm, reference_string, frame_count)` from `algorithms.py`.
    - Returns the full simulation result payload as a JSON response.
  - **Static File Serving:** Serves `index.html` at `/` and proxies static requests for `css/`, `js/`, `assets/`, and `tests/` using Flask's `send_from_directory`.
  - **Entry Point:** Starts the server on `http://0.0.0.0:PORT` (default port 8080) when executed directly.

#### `algorithms.py`
- **Reason for Existence:** The pure Python simulation engine. It implements the page replacement algorithms and generates the pedagogical 8-section explanations and audio narration scripts.
- **Detailed Working:**
  - **`describe_frames(frames)`:** Helper that converts an array of frame contents into human-readable English (e.g. *"Frame 0 contains page 7 and Frame 1 is empty"*).
  - **`generate_step_explanation(...)`:** Constructs the 8-section structured explanation (`stepTitle`, `eventTypeTitle`, `displayHtml`, `displayText`, `audioNarration`, `shortReason`). Formats hit and fault ratios to 2 decimal places. Generates a conversational audio script tailored for speech synthesis.
  - **`simulate_fifo(reference_string, frame_count)`:**
    - Uses an array `frames = [None] * frame_count`.
    - Maintains `fifo_queue = []` storing frame slot indices in chronological order of arrival.
    - Tracks `arrival_step_map` to remember which step loaded each frame.
    - On eviction, pops `fifo_queue.pop(0)`, replaces the resident page in that slot, and appends the slot back to the end of `fifo_queue`.
  - **`simulate_lru(reference_string, frame_count)`:**
    - Uses dictionary `last_used = {}` mapping each page number to the step index where it was last accessed.
    - On hit: updates `last_used[page] = step_index`.
    - On eviction: loops over resident frames to find the page with the minimum `last_used` step. Replaces the victim and updates `last_used` with the current step.
  - **`simulate_optimal(reference_string, frame_count)`:**
    - Implements Belady's Min algorithm.
    - For every resident page, scans the future reference string (`step_index + 1` to end) to determine the next occurrence step.
    - If a page never appears again, its future distance is infinity (`float("inf")`).
    - Evicts the frame holding the page with the furthest future reference. Breaks ties deterministically by selecting the lowest frame index.
  - **`run_page_replacement(algorithm, reference_string, frame_count)`:** Master dispatcher function taking an algorithm name, validating inputs, and delegating to `simulate_fifo`, `simulate_lru`, or `simulate_optimal`.

#### `main.py`
- **Reason for Existence:** Dedicated server entry point configured for serverless deployments (such as Vercel Python runtime).
- **Detailed Working:**
  - Instantiates a Flask `app` and registers `endpoints.api_bp`.
  - Provides a fallback landing page at root `/` rendering a responsive dark-mode hero UI showcasing Vercel + Flask integration and documentation cards.
  - Allows serverless platforms to import `app` directly as the WSGI callable without launching a persistent socket listener.

#### `endpoints/__init__.py`
- **Reason for Existence:** Standard Python package initialization file for the `endpoints` module.
- **Detailed Working:**
  - Imports `api_bp` from `endpoints.routes`.
  - Exports `__all__ = ["api_bp"]`, enabling clean imports across the project (`from endpoints import api_bp`).

#### `endpoints/routes.py`
- **Reason for Existence:** Defines blueprint routes providing REST sample data for testing serverless API functionality.
- **Detailed Working:**
  - Creates Flask `Blueprint("api", __name__)`.
  - Endpoint `GET /api/data`: Returns sample mock items with timestamps to verify JSON serialization.
  - Endpoint `GET /api/items/<int:item_id>`: Returns dynamic item details based on URL path parameters.

---

### Frontend Presentation Layer

#### `index.html`
- **Reason for Existence:** The primary user interface document. Formatted as an accessible, semantic HTML5 single-page application.
- **Detailed Working:**
  - **Header & Engine Badge:** Displays the application title, brand logo, and the `#engine-badge` showing whether the Python backend or client-side engine is active.
  - **Simulation Configuration Form:**
    - Text input `#reference-string-input` for page sequences.
    - Dropdown `#frame-count-select` for physical frames (1 to 7).
    - Dropdown `#algorithm-select` for replacement strategies (FIFO, LRU, Optimal).
    - Simulation toolbar containing Start, Previous Step, Next Step, Play/Pause, Run Complete Simulation, and Reset buttons.
  - **Reference Stream Display:** `#reference-stream-container` displays upcoming and past memory requests as animated badges.
  - **Memory Frames Matrix:** Section `#memory-frames-section` renders the Dark Matrix timeline grid.
  - **Statistics Panel:** 6-card metrics dashboard displaying Total Requests, Page Hits, Page Faults, Hit Ratio, Fault Ratio, and Current Step progress.
  - **Audio Tutor Panel:** Dedicated voice controls toolbar containing voice selection, speed rate (`0.75x` to `1.5x`), Play Explanation, Pause/Resume, Stop, Replay, Mute, and "Narrate All Steps" buttons.
  - **Explanation Card Container:** `#explanation-container` displays the 6 formatted pedagogical breakdown cards for each step.
  - **Educational Guide Section:** Provides textbook definitions of Virtual Memory, Pages, Frames, Hits, Faults, and Belady's Anomaly, with HTML5 embedded demonstration videos (`assets/FIFO.mp4`, `assets/LRU.mp4`, `assets/OPTIMAL.mp4`).
  - **Script Tag:** Loads `js/app.js` using native ES6 module syntax (`<script type="module" src="js/app.js"></script>`).

#### `css/style.css`
- **Reason for Existence:** The unified design system stylesheet. Provides styling for modern light dashboard cards, dark matrix frames, responsive grids, and interactive states.
- **Detailed Working:**
  - **CSS Custom Properties (`:root`):** Defines centralized color tokens for primary backgrounds (`--bg-primary: #f8fafc`), card surfaces, text hierarchy, accent blues, emerald green page hits (`--color-hit-bg`, `--color-hit-border`), rose/crimson page faults, shadows, and typography fonts.
  - **Layout & Grids:** Uses CSS Grid and Flexbox for responsive layouts (`.controls-grid`, `.vis-grid`, `.stats-grid`).
  - **Dark Matrix Styling:**
    - `.memory-frames-card`: Deep matrix container with dark background (`#030712`) and borders.
    - `.matrix-scroll-wrapper`: Horizontal scrolling container with iOS momentum scrolling (`-webkit-overflow-scrolling: touch`).
    - `.matrix-header-col`: Pinned sticky left column displaying white frame tags (`F0`, `F1`, `F2`...).
    - `.matrix-cell`: Precise slot styling indicating green hits/initial load (`#16a34a`), amber evictions (`#d97706`), dark resident slots (`#111827`), or empty slots (`#050811`).
    - Interactive cursor and hover feedback allowing users to click historical columns.
  - **Audio Tutor UI:** Controls toolbar layout, voice selection dropdowns, status pulse dots (`.status-dot`), and audio event badges.
  - **Responsive Media Queries:** Tailored breakpoints at `1024px`, `768px`, and `480px` ensuring layout shifts from multi-column grids to stacked layouts for mobile screens down to 320px.

---

### Frontend Application & Logic Layer (JavaScript)

#### `js/app.js`
- **Reason for Existence:** The central application orchestrator, state machine controller, and DOM event binder.
- **Detailed Working:**
  - **State Model (`appState`):** Stores current configuration (`referenceString`, `frameCount`, `selectedAlgorithm`), simulation results, active step index (`currentStepIndex`), auto-play state (`isPlaying`), historical step inspection flag (`isInspectingHistoricalStep`), and backend availability (`hasBackend`).
  - **`parseReferenceString(rawString)`:** Splits and parses user input using regex, ensuring only non-negative integers are accepted.
  - **`detectBackend()`:** Pings `/api/status` using `fetch()` and updates UI badges based on backend response.
  - **`executeSimulation(...)`:** Directs simulation execution to the Python backend (`/api/simulate`) if online, or falls back to `runPageReplacement` in `js/algorithms.js`.
  - **`updateStepView(options)`:** Coordinates DOM updates across all visual submodules (`renderReferenceStream`, `renderMemoryFrames`, `renderStatistics`, `renderExplanation`, `updateAudioTutorUI`). Dispatches speech synthesis if requested.
  - **Step Controllers:**
    - `handleStartSimulation()`: Validates inputs, executes simulation, sets step to 0, updates view without auto-speaking the entire string.
    - `handleNextStep()` / `handlePrevStep()`: Moves simulation by exactly one step and speaks that step's explanation.
    - `handleHistoricalStepClick(stepIndex)`: Handles user clicking historical matrix columns to inspect past states.
    - `handlePlayPause()`: Sequentially steps through the simulation, synchronizing advancement with the completion of voice narration.
    - `handleRunAll()`: Calculates the entire simulation immediately and jumps directly to the final state.
    - `handleReset()`: Clears simulation state, cancels running timers, and resets DOM elements to blank states.
  - **Audio Tutor Binding:** Binds voice selector, speed selector, play, pause, stop, replay, mute, and narrate-all buttons to methods on `audioTutor`.

#### `js/algorithms.js`
- **Reason for Existence:** The client-side simulation engine. Provides pure algorithmic simulation logic in JavaScript, completely decoupled from DOM or UI dependencies.
- **Detailed Working:**
  - **`simulateFIFO(referenceString, frameCount)`:** Replicates FIFO logic in JavaScript using a queue array `fifoQueue = []` and an `arrivalStepMap` to manage frame indices in order of arrival.
  - **`simulateLRU(referenceString, frameCount)`:** Replicates LRU logic using a `Map` storing page access steps. Selects the victim by finding the resident frame with the smallest last-used step.
  - **`simulateOptimal(referenceString, frameCount)`:** Replicates Belady's Optimal algorithm. Inspects future occurrences in the reference string, picks the page referenced furthest in the future (or never), and breaks ties using the lowest frame index.
  - **`runPageReplacement(algorithm, referenceString, frameCount)`:** Validates algorithm names, executes the corresponding simulator, and returns the standardized simulation result object.

#### `js/explanations.js`
- **Reason for Existence:** Educational text and audio narration generation in JavaScript. Implements the identical 8-section pedagogical structure as `algorithms.py`.
- **Detailed Working:**
  - **`describeFrames(frames)`:** Produces structured English sentences describing current frame allocations (e.g., *"Frame 0 contains page 7, Frame 1 is empty, and Frame 2 contains page 1"*).
  - **`generateStepExplanation(params)`:**
    - Computes cumulative hit and fault ratios formatted to 2 decimal places.
    - Builds the 8 logical sections (A through H): Step Title, What Happened?, Current Memory State, Why Did This Happen?, Algorithm Decision, Action Taken, Updated Memory, Running Statistics.
    - Generates HTML card markup (`displayHtml`) for UI display.
    - Generates natural, punctuation-safe spoken English narration (`audioNarration`) free of confusing symbols, designed specifically for speech synthesis.

#### `js/audioTutor.js`
- **Reason for Existence:** Web Speech API audio controller. Manages speech synthesis, voice prioritization, speed/pitch controls, and step narration synchronization.
- **Detailed Working:**
  - **Class `AudioTutor`:**
    - Verifies browser support (`'speechSynthesis' in window`).
    - Manages internal state: `status` (`'ready'`, `'speaking'`, `'paused'`, `'stopped'`, `'muted'`), current utterance, active step index, and rate (`1.0x` default).
    - **Voice Prioritization (`findBestEnglishVoice`):** Scans browser voices and prioritizes:
      1. `Microsoft Neerja Online (Natural) - English (India)` (`en-IN`).
      2. Any other `en-IN` voice.
      3. Natural/Neural English voices (`natural`, `google`, `neural`, `samantha`, `daniel`, etc.).
      4. Any `en-US` or `en-GB` voice.
      5. Any generic English voice.
    - **Narration Controls:**
      - `speak(text, options)`: Cancels any active utterance, configures text, rate, pitch, and voice, attaches `onend` and `onerror` handlers, and invokes `synth.speak(utterance)`.
      - `pause()` / `resume()` / `stop()` / `replay()`: Exposes fine-grained speech playback control.
      - `toggleMute()`: Mutes speech immediately without altering visual simulation progress.
      - `narrateAll(steps, onStepChange, onComplete)`: Sequentially narrates all steps in the simulation without requiring visual re-animation.
    - **Observer Pattern (`subscribe`):** Allows UI components to subscribe to audio tutor state changes, keeping status badges and button states synchronized.

#### `js/visualizer.js`
- **Reason for Existence:** DOM rendering engine. Responsible for transforming simulation data into visual representations on screen.
- **Detailed Working:**
  - **`renderReferenceStream(container, referenceString, currentStepIndex)`:** Dynamically generates horizontal pills for the reference string, highlighting active, past, and upcoming page requests.
  - **`renderMemoryFrames(container, frameCount, frames, highlightInfo, matrixData)`:** 
    - Builds the 2D Dark Matrix grid.
    - Creates the sticky left column with white rounded badges for frames (`F0`, `F1`, `F2`...).
    - Iterates through all simulation steps to render matrix columns containing frame slots and hit/fault status indicators.
    - Attaches click listeners to historical step columns to enable time-travel inspection.
  - **`renderStatistics(stats)`:** Formats and displays total requests, hits, faults, hit ratio, fault ratio, and step progress.
  - **`renderExplanation(container, stepOrMessage, isHit, options)`:** Injects the 6 formatted pedagogical breakdown cards into the DOM. Shows an inspection badge when viewing historical steps.
  - **`updateAudioTutorUI(audioState, currentStep, totalSteps, isHistorical)`:** Syncs audio tutor buttons (Speak, Pause, Resume, Stop, Replay, Mute, Narrate All), updates the status dot, and displays step progress badges.
  - **`resetVisualizer()`:** Resets all visual elements to their default empty states.

---

### Automated Testing & Verification

#### `tests/algorithms.test.js`
- **Reason for Existence:** Regression test suite verifying algorithmic accuracy, input validation, pedagogical structure, and audio tutor behavior.
- **Detailed Working:**
  - Runs in Node.js via `npm test`.
  - Implements a self-contained test runner (`describe`, `test`, `assert`).
  - Contains **22 comprehensive tests** organized into 7 test suites:
    1. *Interface & Module Structure:* Verifies function exports and schema structure.
    2. *Input Parser & Validation:* Tests comma/space delimited strings and error handling for invalid tokens.
    3. *Benchmark Test Cases:* Validates FIFO, LRU, and Optimal algorithms against standard textbook benchmarks (`7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2` with 3 frames) with 2 decimal precision.
    4. *Immediate Hit & Initial Load Scenarios:* Checks edge cases where hits immediately follow loads.
    5. *8-Section Logical Structure & Audio Narration:* Verifies presence of all 8 explanation sections and ensures natural formatting in `describeFrames`.
    6. *Audio Tutor Voice Priority & Safety:* Verifies `findBestEnglishVoice` prioritizes `Microsoft Neerja (en-IN)` and confirms safe initialization in Node.js without crashing.
    7. *Deterministic History & Edge Cases:* Verifies single-frame boundaries, identical page requests, and repeatable step history.

---

### Assets & Static Media

#### `assets/favicon.svg`
- **Reason for Existence:** The primary brand icon for the application.
- **Detailed Working:**
  - High-resolution SVG vector graphic representing a hardware RAM/CPU memory chip.
  - Features dark navy background, cyan traces, glowing memory nodes, and gold connection pins.
  - Used in the application header and referenced as the browser tab icon.

#### `public/favicon.ico`
- **Reason for Existence:** Standard binary icon file for legacy web browser compatibility.
- **Detailed Working:**
  - Stored in `public/` and served at root `/favicon.ico` to fulfill standard browser favicon requests and avoid 404 console errors.

#### `assets/FIFO.mp4`
- **Reason for Existence:** Educational instructional video asset.
- **Detailed Working:**
  - Encoded MP4 video demonstrating First-In, First-Out (FIFO) page replacement, embedded in the educational guide section of `index.html`.

#### `assets/LRU.mp4`
- **Reason for Existence:** Educational instructional video asset.
- **Detailed Working:**
  - Encoded MP4 video demonstrating Least Recently Used (LRU) page replacement, embedded in the educational guide section of `index.html`.

#### `assets/OPTIMAL.mp4`
- **Reason for Existence:** Educational instructional video asset.
- **Detailed Working:**
  - Encoded MP4 video demonstrating Belady's Optimal algorithm, embedded in the educational guide section of `index.html`.

---

## 4. Data Contracts and Parity Validation

Both the Python engine (`algorithms.py`) and the JavaScript engine (`js/algorithms.js` + `js/explanations.js`) adhere to an identical JSON data contract. This guarantees that frontend rendering (`js/visualizer.js`) and audio playback (`js/audioTutor.js`) operate identically regardless of whether the simulation is computed on the Python server or locally in the browser.

### Simulation Result Schema (`POST /api/simulate` Response)

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
  "steps": [
    {
      "stepIndex": 0,
      "page": 7,
      "isHit": false,
      "eventType": "FAULT_INITIAL",
      "framesBefore": [null, null, null],
      "frames": [7, null, null],
      "victimPage": null,
      "victimFrameIndex": 0,
      "cumulativeHits": 0,
      "cumulativeFaults": 1,
      "reason": "Page 7 caused a PAGE FAULT. Loaded into empty Frame 0.",
      "explanation": "[Step 1 of 13 — Page 7] [PAGE FAULT — EMPTY FRAME AVAILABLE]\nWhat Happened: The CPU requested page 7...",
      "displayHtml": "<div class=\"explanation-sections\">...</div>",
      "audioNarration": "Step 1, Page 7, It is Page Fault Because Empty Frame is available. The CPU requested page 7, but it is not currently in memory...",
      "title": "PAGE FAULT — EMPTY FRAME AVAILABLE",
      "stepTitle": "Step 1 of 13 — Page 7",
      "eventTypeTitle": "PAGE FAULT — EMPTY FRAME AVAILABLE",
      "replacementMetadata": {
        "queuePosition": 1
      }
    }
  ]
}
```

### Event Classification Reference

| Event Type Code | Trigger Condition | Display Badge | Matrix Cell Color |
|---|---|---|---|
| `HIT` | Requested page is already resident in a frame | `PAGE HIT` | Emerald Green (`#16a34a`) |
| `FAULT_INITIAL` | Requested page is missing, but an empty frame exists | `PAGE FAULT — EMPTY FRAME AVAILABLE` | Emerald Green (`#16a34a`) |
| `FAULT_REPLACE` | Requested page is missing and all frames are full | `PAGE FAULT — PAGE REPLACEMENT REQUIRED` | Amber Orange (`#d97706`) |

---

*This document is maintained as the authoritative architectural blueprint and file reference for the Virtual Memory & Page Replacement Virtualizer.*
