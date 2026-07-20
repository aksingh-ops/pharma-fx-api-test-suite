// tests/api/fda-drugs.spec.ts
//
// Automated API tests for the FDA Drug API (OpenFDA).
// Documentation: https://open.fda.gov/apis/drug/
//
// Test coverage:
//   Suite 1 -- Drug adverse events (7 tests)
//   Suite 2 -- Drug recalls / enforcement (6 tests)
//   Suite 3 -- Drug labeling (5 tests)
//   Suite 4 -- Pagination and reliability (2 tests)
//
// Business context: The FDA Drug API is the foundation for
// CMS Medicare Part D Star Ratings analytics. Adverse event
// data, recalls, and labeling drive adherence gap analysis,
// prescriber outreach prioritization, and health plan
// quality bonus revenue calculations.
// Connects to: medicare-partd-adherence-gap project.

import { test, expect } from "@playwright/test";
import {
  FDA_BASE_URL,
  searchAdverseEvents,
  getDrugRecalls,
  searchDrugLabels,
} from "../utils/fda-client";

// -------------------------------------------------------
// Suite 1: Drug Adverse Events
// -------------------------------------------------------
test.describe("FDA API -- Drug Adverse Events", () => {

  test("GET /drug/event.json returns HTTP 200", async ({ request }) => {
    const response = await request.get(
      `${FDA_BASE_URL}/drug/event.json?limit=1`
    );
    expect(response.status()).toBe(200);
  });

  test("GET adverse events response has meta and results fields", async ({ request }) => {
    const data = await searchAdverseEvents(request, "aspirin", 5);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
  });

  test("GET adverse events result count does not exceed limit", async ({ request }) => {
    const data = await searchAdverseEvents(request, "aspirin", 3);

    expect(data.results.length).toBeLessThanOrEqual(3);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("GET adverse events meta.results.total is a positive number", async ({ request }) => {
    const data = await searchAdverseEvents(request, "aspirin", 1);

    expect(data.meta.results).toHaveProperty("total");
    expect(data.meta.results.total).toBeGreaterThan(0);
    // Aspirin is one of the most-reported drugs in FAERS
    expect(data.meta.results.total).toBeGreaterThan(100);
  });

  test("GET adverse events each result has a safetyreportid", async ({ request }) => {
    const data = await searchAdverseEvents(request, "metformin", 5);

    for (const result of data.results) {
      expect(result).toHaveProperty("safetyreportid");
      expect(typeof result.safetyreportid).toBe("string");
      expect(result.safetyreportid.length).toBeGreaterThan(0);
    }
  });

  test("GET adverse events meta has disclaimer field", async ({ request }) => {
    const data = await searchAdverseEvents(request, "aspirin", 1);

    expect(data.meta).toHaveProperty("disclaimer");
    expect(typeof data.meta.disclaimer).toBe("string");
    expect(data.meta.disclaimer.length).toBeGreaterThan(0);
  });

  test("GET adverse events for unknown drug returns 404", async ({ request }) => {
    const response = await request.get(
      `${FDA_BASE_URL}/drug/event.json?search=patient.drug.medicinalproduct:"XYZNOTAREALDRUG99999"&limit=1`
    );
    // FDA returns 404 when no records match
    expect(response.status()).toBe(404);
  });

});

// -------------------------------------------------------
// Suite 2: Drug Recalls / Enforcement
// -------------------------------------------------------
test.describe("FDA API -- Drug Recalls", () => {

  test("GET /drug/enforcement.json returns HTTP 200", async ({ request }) => {
    const response = await request.get(
      `${FDA_BASE_URL}/drug/enforcement.json?limit=1`
    );
    expect(response.status()).toBe(200);
  });

  test("GET drug recalls response has correct structure", async ({ request }) => {
    const data = await getDrugRecalls(request, 5);

    expect(data).toHaveProperty("meta");
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  test("GET drug recalls each result has required fields", async ({ request }) => {
    const data = await getDrugRecalls(request, 3);

    for (const recall of data.results) {
      expect(recall).toHaveProperty("recall_number");
      expect(recall).toHaveProperty("status");
      expect(recall).toHaveProperty("product_description");
      expect(recall).toHaveProperty("classification");
      expect(recall).toHaveProperty("recalling_firm");
    }
  });

  test("GET drug recalls classification is a valid FDA class", async ({ request }) => {
    const data = await getDrugRecalls(request, 10);

    const validClasses = ["Class I", "Class II", "Class III"];
    for (const recall of data.results) {
      expect(validClasses).toContain(recall.classification);
    }
  });

  test("GET drug recalls recall_number is a non-empty string", async ({ request }) => {
    const data = await getDrugRecalls(request, 5);

    for (const recall of data.results) {
      expect(typeof recall.recall_number).toBe("string");
      expect(recall.recall_number.length).toBeGreaterThan(0);
    }
  });

  test("GET drug recalls limit parameter is respected", async ({ request }) => {
    const data = await getDrugRecalls(request, 2);
    expect(data.results.length).toBeLessThanOrEqual(2);
  });

});

// -------------------------------------------------------
// Suite 3: Drug Labeling
// -------------------------------------------------------
test.describe("FDA API -- Drug Labeling", () => {

  test("GET /drug/label.json returns HTTP 200 for known drug", async ({ request }) => {
    const response = await request.get(
      `${FDA_BASE_URL}/drug/label.json?search=openfda.brand_name:"tylenol"&limit=1`
    );
    expect(response.status()).toBe(200);
  });

  test("GET drug label results have openfda metadata block", async ({ request }) => {
    const data = await searchDrugLabels(request, "tylenol", 3);

    for (const result of data.results) {
      expect(result).toHaveProperty("openfda");
    }
  });

  test("GET drug label meta.results.total is positive", async ({ request }) => {
    const data = await searchDrugLabels(request, "aspirin", 1);
    expect(data.meta.results.total).toBeGreaterThan(0);
  });

  test("GET drug label for unknown brand name returns 404", async ({ request }) => {
    const response = await request.get(
      `${FDA_BASE_URL}/drug/label.json?search=openfda.brand_name:"XYZNOTABRAND99999"&limit=1`
    );
    expect(response.status()).toBe(404);
  });

  test("GET drug label responds within 5000ms", async ({ request }) => {
    const start = Date.now();
    await request.get(
      `${FDA_BASE_URL}/drug/label.json?search=openfda.brand_name:"tylenol"&limit=1`
    );
    expect(Date.now() - start).toBeLessThan(5000);
  });

});

// -------------------------------------------------------
// Suite 4: Pagination and reliability
// -------------------------------------------------------
test.describe("FDA API -- Pagination and Reliability", () => {

  test("GET with skip parameter returns different records", async ({ request }) => {
    const r1 = await request.get(
      `${FDA_BASE_URL}/drug/enforcement.json?limit=3&skip=0`
    );
    const r2 = await request.get(
      `${FDA_BASE_URL}/drug/enforcement.json?limit=3&skip=3`
    );

    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);

    const d1 = await r1.json() as { results: Array<{ recall_number: string }> };
    const d2 = await r2.json() as { results: Array<{ recall_number: string }> };

    const page1Numbers = d1.results.map(r => r.recall_number);
    const page2Numbers = d2.results.map(r => r.recall_number);

    // No overlap -- pages must contain different records
    const overlap = page1Numbers.filter(n => page2Numbers.includes(n));
    expect(overlap.length).toBe(0);
  });

  test("GET same historical FX endpoint twice returns identical rates", async ({ request }) => {
    const r1 = await request.get(
      "https://api.frankfurter.app/2024-01-15?from=USD&to=EUR"
    );
    const r2 = await request.get(
      "https://api.frankfurter.app/2024-01-15?from=USD&to=EUR"
    );

    const d1 = await r1.json() as { rates: Record<string, number> };
    const d2 = await r2.json() as { rates: Record<string, number> };

    // Historical rates are immutable -- must be identical every time
    expect(d1.rates["EUR"]).toBe(d2.rates["EUR"]);
  });

});
