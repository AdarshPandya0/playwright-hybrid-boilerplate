# 🎭 Playwright Hybrid Framework Boilerplate

Welcome to the **Enterprise Playwright Hybrid Framework**!

This boilerplate is designed to handle complex automation challenges right out of the box.

### Key Features

* **Self-Healing Session Injection** — Completely bypasses UI logins using cached authentication tokens when possible to.
* **Decoupled Garbage Collection** — Prevents file-locking issues during parallel execution and sharding.
* **Global Base Page Pattern** — Automatically handles unpredictable UI prompts.

---

# 🛠️ Prerequisites

Before getting started, ensure the following are installed on your machine:

* **Node.js** (v18 or higher)
* **Git**
* A code editor (**VS Code** recommended)

---

# 🚀 Setup Guide

Follow these steps to safely initialize the framework without overwriting any custom configuration.

## Step 1: Clone the Repository

Clone the repository and navigate into the project directory.

```bash
git clone <your-repository-url>
cd playwright-hybrid-boilerplate
```

---

## Step 2: Install Node Dependencies

> ⚠️ **Important:** Do **NOT** run `npm init playwright`.
>
> This repository is already fully configured.

Simply install the dependencies defined in `package.json`:

```bash
npm install
```

This downloads all required libraries (such as `@playwright/test`, `npm-run-all`, and others) into the `node_modules` directory without overwriting the custom `playwright.config.js`.

---

## Step 3: Install Browser Binaries

Playwright requires its own browser binaries for Chromium, Firefox, and WebKit.

Run:

```bash
npx playwright install --with-deps
```

The `--with-deps` flag ensures your operating system has all required browser dependencies, fonts, and media libraries.

---

## Step 4: Configure the Environment

The framework uses a `.env` file to store credentials and environment-specific configuration.

### Create Your `.env` File

**Mac/Linux**

```bash
cp .env.example .env
```

**Windows (PowerShell)**

```powershell
Copy-Item .env.example -Destination .env
```

Open the newly created `.env` file and provide:

* QA environment URLs
* User credentials
* Any additional environment variables required by your application

### Parallel Execution Requirement

> ⚠️ To run the fully parallel sharded suite, provide **Multiple separate user accounts as per your need** in the `.env` files.
>
> This prevents test workers from invalidating each other's sessions during execution.

---

# 🎯 Running Your First Test

The framework is now fully initialized.

Several execution modes are available through the configured npm scripts.

---

## Option A: Visual Runner (Recommended for Test Development)

Launch Playwright's UI mode:

```bash
npx playwright test --ui
```

Benefits:

* Watch browser execution live
* Inspect the DOM
* Review network requests
* Debug and run individual tests

---

## Option B: Headless Runner (Standard Execution)

Run the complete suite in the background:

```bash
npm run test:local
```

Before execution, the framework automatically runs:

```text
utils/cleanup.js
```

This removes:

* Stale reports
* Expired authentication files
* Temporary artifacts

---

## Option C: Sharded Runner (Maximum Speed)

Execute the test suite in parallel across four shards:

```bash
npm run test:sharded
```

This configuration:

* Splits the suite into 4 equal chunks
* Uses 4 independent browser contexts
* Uses 4  * (Number of worker per each shard) separate user accounts
* Maximizes execution speed

---

# 🧠 Authentication Flow

The framework uses an intelligent authentication strategy designed for both speed and reliability.

## First Run: The Slow Path

When the repository is cloned for the first time, no cached authentication data exists.

The framework will:

1. Open a browser
2. Enter credentials
3. Perform a full login
4. Capture authentication tokens
5. Store session data in the hidden `.auth/` directory

---

## Subsequent Runs: The Fast Path

Once authentication data is available, the framework skips the login process entirely.

Instead, it:

1. Loads cached session data
2. Injects tokens directly into browser storage
3. Launches the application already authenticated

This reduces startup time from several seconds to milliseconds.

---

## Self-Healing Authentication

The framework continuously validates cached sessions.

If:

* Authentication tokens are older than **3 hours**, or
* The application returns **401 Unauthorized**

the framework will automatically:

1. Delete invalid session files
2. Launch the browser
3. Perform a fresh login
4. Capture new authentication tokens
5. Continue test execution

This recovery process happens automatically without causing test failures.

---

# 📁 Framework Highlights

| Feature                         | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| Self-Healing Session Injection  | Automatically refreshes expired authentication sessions |
| Cached Authentication           | Eliminates repetitive UI logins                         |
| Decoupled Garbage Collection    | Prevents file-locking issues during parallel runs       |
| Global Base Page Pattern        | Centralized handling of unexpected UI modals            |
| Sharded Execution               | Parallel execution across multiple workers              |
| Environment-Based Configuration | Secure credential management via `.env` files           |

---

Happy Testing! 🎭🚀
