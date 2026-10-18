<<<<<<< HEAD
# The Hyper-Visual Virtual Memory & Page Replacement Virtualizer

> An interactive, educational web application for visualizing virtual memory management, demand paging, and page replacement algorithms.

---

## 1. Project Objective

The objective of **The Hyper-Visual Virtual Memory & Page Replacement Virtualizer** is to help computer science students, educators, and systems developers intuitively understand how operating systems manage virtual memory. Through step-by-step visualizations, users can observe page hits, page faults, and victim frame replacements across core replacement strategies: **FIFO (First-In, First-Out)**, **LRU (Least Recently Used)**, and **Optimal (Belady's Algorithm)**.

---

## 2. Technology Stack

- **Markup:** HTML5 (Semantic elements, accessible ARIA attributes)
- **Styling:** CSS3 (Modern dashboard design system, custom properties, responsive layout, projector-ready light theme)
- **Scripting:** Vanilla JavaScript (ES Modules, standard event-driven architecture, zero third-party framework dependencies)
- **Icons & Assets:** Native SVG (`assets/favicon.svg`)
- **Testing:** Vanilla Node.js automated test runner (`tests/algorithms.test.js`)

---

## 3. Project File Structure

```text
virtual-memory-virtualizer/
├── assets/
│   └── favicon.svg           # Custom SVG icon representing RAM frames & page slots
├── css/
│   └── style.css             # Main stylesheet (clean navy/blue theme, hit/fault badges, responsive grid)
├── js/
│   ├── algorithms.js         # Pure simulation logic and interfaces (FIFO, LRU, Optimal)
│   ├── visualizer.js         # DOM rendering functions (frames, reference stream, statistics)
│   └── app.js                # Application controller, input validation, and playback orchestration
├── tests/
│   └── algorithms.test.js    # Automated unit and interface test suite
├── index.html                # Main application interface and educational guide
├── package.json              # ES module configuration and test script definition
└── README.md                 # Project documentation and user guide
```

---

## 4. Setup and Run Instructions

Because the project uses native JavaScript ES Modules (`import`/`export`), it should be served via a local web server rather than opening `index.html` via the `file://` protocol.

### Option A: Using Python (Recommended)

1. Open a terminal and navigate to the project directory:
   ```bash
   cd "virtual-memory-virtualizer"
   ```
2. Start Python's built-in HTTP server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000/
   ```

### Option B: Using Node.js `npx serve` or `http-server`

1. In the project directory:
   ```bash
   npx serve .
   ```
   or
   ```bash
   npx -y http-server -p 8000
   ```
2. Navigate to the displayed local URL (e.g. `http://localhost:8000`).

---

## 5. Automated Testing Instructions

Run the automated test suite directly using Node.js:

```bash
cd "virtual-memory-virtualizer"
node tests/algorithms.test.js
```
or
```bash
npm test
```

### Test Scope:
- Verification of exported simulation interfaces (`simulateFIFO`, `simulateLRU`, `simulateOptimal`, `runPageReplacement`).
- Input validation and parsing of reference strings (handling delimiters, edge cases, negative numbers).
- Pre-configured test cases for Phase 2 algorithm verification against standard reference strings:
  `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2` with 3 frames.

---

## 6. Planned Features (Phased Roadmap)

- **Phase 1 (Completed):** Clean project structure, UI layout foundation, control panel, responsive styling, SVG favicon, and automated test suite.
- **Phase 2:** Implementation of core page replacement algorithms (FIFO queue, LRU access stack/timestamps, and Optimal future-reference lookahead).
- **Phase 3:** Interactive step-by-step playback, real-time memory frame animations, and dynamic decision explanations.
- **Phase 4:** Belady's Anomaly demonstrator and multi-algorithm comparison matrix with performance graphs.
=======
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fvercel%2Ftree%2Fmain%2Fexamples%2Fflask&demo-title=Flask%20API&demo-description=Use%20Flask%20API%20on%20Vercel%20with%20Serverless%20Functions%20using%20the%20Python%20Runtime.&demo-url=https%3A%2F%2Fvercel-plus-flask.vercel.app%2F&demo-image=https://assets.vercel.com/image/upload/v1669994600/random/python.png)

# Flask + Vercel

This example shows how to use Flask on Vercel with Serverless Functions using the [Python Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python).

## Demo

https://vercel-plus-flask.vercel.app/

## How it Works

This example uses the Web Server Gateway Interface (WSGI) with Flask to handle requests on Vercel with Serverless Functions.

## Running Locally

```bash
npm i -g vercel
python -m venv .venv
source .venv/bin/activate
uv sync  # or alternatively pip install flask gunicorn
gunicorn main:app
```

Your Flask application is now available at `http://localhost:3000`.

## One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fvercel%2Ftree%2Fmain%2Fexamples%2Fflask&demo-title=Flask%20API&demo-description=Use%20Flask%20API%20on%20Vercel%20with%20Serverless%20Functions%20using%20the%20Python%20Runtime.&demo-url=https%3A%2F%2Fvercel-plus-flask.vercel.app%2F&demo-image=https://assets.vercel.com/image/upload/v1669994600/random/python.png)
>>>>>>> c8ed70fc159f8d8213872f345fd90913cd53c948
