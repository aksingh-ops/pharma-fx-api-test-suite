# pharma-fx-api-test-suite

![API Tests](https://github.com/aksingh-ops/pharma-fx-api-test-suite/actions/workflows/playwright.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.44-green?style=flat-square&logo=playwright&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-Collection-orange?style=flat-square&logo=postman&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![APIs](https://img.shields.io/badge/APIs-FDA%20%7C%20Frankfurter-0A1628?style=flat-square)

Automated API test suite for two public REST APIs: the **FDA Drug API** (OpenFDA) and the **Frankfurter Currency Exchange Rate API**. Built with Playwright and TypeScript, tested manually with Postman, and runs automatically on every push via GitHub Actions.

---

## Why These APIs

**FDA Drug API** connects directly to healthcare analytics work. The FDA adverse event database (FAERS), drug recalls, and drug labeling are the upstream data sources for CMS Medicare Part D Star Ratings analytics -- PDC (Proportion of Days Covered), HEDIS measures, and pharmacy outreach prioritization all trace back to FDA-sourced drug data. Relevant project: [medicare-partd-adherence-gap](https://github.com/aksingh-ops/medicare-partd-adherence-gap).

**Frankfurter FX API** connects to financial services analytics. Currency mismatches are a documented source of trade settlement fails in Global Banking and Markets operations. FX rate validation is part of the operational data quality layer that prevents settlement SLO breaches. Relevant project: [gbm-settlement-intelligence](https://github.com/aksingh-ops/gbm-settlement-intelligence).

---

## Test Coverage

| Suite | API | Tests | What is covered |
|---|---|---|---|
| FX Latest Rates | Frankfurter | 7 | Status, response time, schema, rate values, major currencies, plausible ranges |
| FX Historical Rates | Frankfurter | 5 | Date accuracy, currency filtering, value types, future date error, invalid date error |
| FX Available Currencies | Frankfurter | 3 | Non-empty response, major currencies present, code format validation |
| FX Error Handling | Frankfurter | 3 | Invalid currency error, error message field, historical rate consistency |
| FDA Adverse Events | FDA | 7 | Status, schema, result count, total count, safetyreportid, disclaimer, unknown drug 404 |
| FDA Drug Recalls | FDA | 6 | Status, schema, required fields, classification validity, recall number format, limit |
| FDA Drug Labeling | FDA | 5 | Status, openfda metadata, total count, unknown brand 404, response time |
| Pagination and Reliability | Both | 2 | Pagination non-overlap, historical rate consistency across calls |
| **Total** | | **38** | |

---

## Project Structure

```
pharma-fx-api-test-suite/
|
|-- playwright.config.ts          Playwright configuration
|-- tsconfig.json                 TypeScript configuration
|-- package.json
|
|-- tests/
|   |-- utils/
|   |   |-- frankfurter-client.ts  TypeScript client + type definitions for FX API
|   |   `-- fda-client.ts          TypeScript client + type definitions for FDA API
|   `-- api/
|       |-- fx-rates.spec.ts       18 Playwright tests for Frankfurter FX API
|       `-- fda-drugs.spec.ts      20 Playwright tests for FDA Drug API
|
|-- postman/
|   |-- pharma-fx-collection.json  6 manual requests with assertions
|   `-- api-testing-environment.json  Environment variables (base URLs, currency)
|
`-- .github/
    `-- workflows/
        `-- playwright.yml         GitHub Actions CI/CD pipeline
```

---

## How to Run

### Prerequisites

- Node.js 20 or higher -- download from [nodejs.org](https://nodejs.org)
- Postman -- download from [postman.com](https://www.postman.com/downloads/) (for manual testing only)

### Setup

```bash
git clone https://github.com/aksingh-ops/pharma-fx-api-test-suite
cd pharma-fx-api-test-suite
npm install
npx playwright install chromium
```

### Run all 38 automated tests

```bash
npm test
```

### Run with HTML report

```bash
npm run test:report
npx playwright show-report
```

### Run one suite only

```bash
npm run test:fx       # Frankfurter FX tests only
npm run test:fda      # FDA Drug tests only
```

### Run Postman collection via Newman CLI

```bash
npm run postman:run
```

### Run Postman collection manually

1. Open Postman
2. Click Import
3. Import `postman/pharma-fx-collection.json`
4. Import `postman/api-testing-environment.json`
5. Select the environment from the dropdown
6. Click Run Collection

---

## Tools Used

| Tool | Purpose |
|---|---|
| **Playwright** | API test runner -- sends HTTP requests, asserts responses, generates HTML report |
| **TypeScript** | Language -- typed API client classes prevent runtime errors from wrong field assumptions |
| **Postman** | Manual API exploration and collection-based testing with JavaScript assertions |
| **Newman CLI** | Runs the Postman collection from the command line -- enables CI integration |
| **GitHub Actions** | Runs all 38 tests automatically on every push to main |

---

## CI/CD Pipeline

The `.github/workflows/playwright.yml` workflow runs on every push to `main` and on every pull request:

1. Checkout code
2. Set up Node.js 22
3. Install dependencies (`npm ci`)
4. Install Playwright (`npx playwright install chromium`)
5. Run all tests (`npx playwright test`)
6. Upload HTML report as a downloadable artifact (retained 30 days)

The badge at the top of this README shows the live status of the most recent run.

---

## What This Demonstrates

- **REST API fundamentals** -- HTTP methods, status codes, request/response structure, query parameters, headers
- **TypeScript with interfaces** -- strongly typed API response shapes catch schema changes immediately
- **Playwright API testing** -- `APIRequestContext` for programmatic HTTP calls without a browser
- **Test design patterns** -- positive tests, negative tests, boundary tests, schema validation, performance assertions
- **Postman collections** -- organized request groups with pre-written JavaScript test assertions and environment variables
- **GitHub Actions CI/CD** -- automated pipeline that proves tests pass on every code change
- **Domain-connected testing** -- tests are grounded in real healthcare and financial services data, not generic placeholder APIs

---

## APIs

| API | Base URL | Docs | Rate Limit |
|---|---|---|---|
| Frankfurter FX | `https://api.frankfurter.app` | [frankfurter.app/docs](https://www.frankfurter.app/docs/) | No key required |
| FDA Drug API | `https://api.fda.gov` | [open.fda.gov/apis/drug](https://open.fda.gov/apis/drug/) | 240 req/min, no key required |

---

## Author

**Akash Singh**
M.S. Business Analytics -- Iowa State University
[github.com/aksingh-ops](https://github.com/aksingh-ops) | [Portfolio](https://aksingh-ops.github.io)
