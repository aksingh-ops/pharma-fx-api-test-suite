// tests/api/fx-rates.spec.ts
//
// Automated API tests for the Frankfurter Currency Exchange Rate API.
// Documentation: https://www.frankfurter.app/docs/
//
// Test coverage:
//   Suite 1 -- Latest exchange rates (7 tests)
//   Suite 2 -- Historical exchange rates (5 tests)
//   Suite 3 -- Available currencies endpoint (3 tests)
//   Suite 4 -- Error handling and edge cases (3 tests)
//
// Business context: FX settlement accuracy is a documented source of
// trade settlement fails in GBM operations. These tests validate the
// data quality and reliability of the rate source used in settlement
// analytics pipelines.

import { test, expect } from "@playwright/test";
import {
  FX_BASE_URL,
  getLatestRates,
  getHistoricalRates,
  getAvailableCurrencies,
} from "../utils/frankfurter-client";

// -------------------------------------------------------
// Suite 1: Latest exchange rates
// -------------------------------------------------------
test.describe("FX API -- Latest Rates", () => {

  test("GET /latest returns HTTP 200", async ({ request }) => {
    const response = await request.get(`${FX_BASE_URL}/latest`);
    expect(response.status()).toBe(200);
  });

  test("GET /latest responds within 2000ms", async ({ request }) => {
    const start = Date.now();
    await request.get(`${FX_BASE_URL}/latest`);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  test("GET /latest response body has required fields", async ({ request }) => {
    const data = await getLatestRates(request, "USD");

    expect(data.base).toBe("USD");
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.rates).toBeDefined();
    expect(Object.keys(data.rates).length).toBeGreaterThan(0);
    expect(typeof data.amount).toBe("number");
  });

  test("GET /latest all rate values are positive numbers", async ({ request }) => {
    const data = await getLatestRates(request, "USD");

    for (const [, rate] of Object.entries(data.rates)) {
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThan(0);
      // Sanity upper bound -- no valid currency rate exceeds 100,000 vs USD
      expect(rate).toBeLessThan(100_000);
    }
  });

  test("GET /latest includes major currencies EUR, GBP, JPY, CHF", async ({ request }) => {
    const data = await getLatestRates(request, "USD");

    expect(data.rates).toHaveProperty("EUR");
    expect(data.rates).toHaveProperty("GBP");
    expect(data.rates).toHaveProperty("JPY");
    expect(data.rates).toHaveProperty("CHF");
  });

  test("GET /latest EUR vs USD rate is in plausible range", async ({ request }) => {
    const data = await getLatestRates(request, "USD");

    // EUR/USD has historically ranged from 0.70 to 1.40
    // This validates data sanity, not an exact value
    expect(data.rates["EUR"]).toBeGreaterThan(0.70);
    expect(data.rates["EUR"]).toBeLessThan(1.40);
  });

  test("GET /latest with EUR base currency returns USD in rates", async ({ request }) => {
    const data = await getLatestRates(request, "EUR");

    expect(data.base).toBe("EUR");
    expect(data.rates).toHaveProperty("USD");
    expect(data.rates["USD"]).toBeGreaterThan(0);
  });

});

// -------------------------------------------------------
// Suite 2: Historical exchange rates
// -------------------------------------------------------
test.describe("FX API -- Historical Rates", () => {

  test("GET /2024-01-15 returns the correct date", async ({ request }) => {
    const data = await getHistoricalRates(request, "2024-01-15");
    expect(data.date).toBe("2024-01-15");
  });

  test("GET historical returns only the requested target currencies", async ({ request }) => {
    const data = await getHistoricalRates(
      request, "2024-01-15", "USD", ["EUR", "GBP"]
    );

    expect(data.rates).toHaveProperty("EUR");
    expect(data.rates).toHaveProperty("GBP");
    // JPY was not requested -- must not appear
    expect(data.rates).not.toHaveProperty("JPY");
  });

  test("GET historical rate values are numbers", async ({ request }) => {
    const data = await getHistoricalRates(
      request, "2024-06-01", "USD", ["EUR", "GBP", "JPY"]
    );

    expect(typeof data.rates["EUR"]).toBe("number");
    expect(typeof data.rates["GBP"]).toBe("number");
    expect(typeof data.rates["JPY"]).toBe("number");
  });

  test("GET future date returns a non-200 error response", async ({ request }) => {
    // Future dates have no ECB rates yet
    const response = await request.get(`${FX_BASE_URL}/2099-12-31?from=USD`);
    expect(response.status()).not.toBe(200);
  });

  test("GET invalid date format returns a non-200 error", async ({ request }) => {
    const response = await request.get(`${FX_BASE_URL}/not-a-date?from=USD`);
    expect(response.status()).not.toBe(200);
  });

});

// -------------------------------------------------------
// Suite 3: Available currencies
// -------------------------------------------------------
test.describe("FX API -- Available Currencies", () => {

  test("GET /currencies returns a non-empty object", async ({ request }) => {
    const data = await getAvailableCurrencies(request);
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  test("GET /currencies includes USD, EUR, GBP, JPY", async ({ request }) => {
    const data = await getAvailableCurrencies(request);

    expect(data).toHaveProperty("USD");
    expect(data).toHaveProperty("EUR");
    expect(data).toHaveProperty("GBP");
    expect(data).toHaveProperty("JPY");
  });

  test("GET /currencies keys are 3-letter uppercase codes", async ({ request }) => {
    const data = await getAvailableCurrencies(request);

    for (const [code, name] of Object.entries(data)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(typeof name).toBe("string");
      expect((name as string).length).toBeGreaterThan(0);
    }
  });

});

// -------------------------------------------------------
// Suite 4: Error handling
// -------------------------------------------------------
test.describe("FX API -- Error Handling", () => {

  test("Invalid base currency returns a non-200 response", async ({ request }) => {
    const response = await request.get(
      `${FX_BASE_URL}/latest?from=NOTACURRENCY`
    );
    expect(response.status()).not.toBe(200);
  });

  test("Error response body contains a message field", async ({ request }) => {
    const response = await request.get(
      `${FX_BASE_URL}/latest?from=FAKECURRENCY`
    );
    const body = await response.json() as { message?: string };
    expect(body).toHaveProperty("message");
  });

  test("Historical rates are consistent on repeated calls", async ({ request }) => {
    // Historical rates are fixed -- calling twice must return same EUR rate
    const r1 = await request.get(`${FX_BASE_URL}/2024-01-15?from=USD&to=EUR`);
    const r2 = await request.get(`${FX_BASE_URL}/2024-01-15?from=USD&to=EUR`);

    const d1 = await r1.json() as { rates: Record<string, number> };
    const d2 = await r2.json() as { rates: Record<string, number> };

    expect(d1.rates["EUR"]).toBe(d2.rates["EUR"]);
  });

});
