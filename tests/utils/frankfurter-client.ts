// tests/utils/frankfurter-client.ts
//
// Type definitions and helper functions for the Frankfurter
// Currency Exchange Rate API.
//
// Documentation: https://www.frankfurter.app/docs/
//
// Business context: FX rate validation is directly relevant to
// trade settlement analytics in GBM operations -- currency
// mismatches are a documented cause of settlement fails.
// This connects to the gbm-settlement-intelligence project.
//
// API properties:
//   - Free to use, no API key required
//   - Backed by European Central Bank reference rates
//   - Updated on every trading day around 16:00 CET
//   - Data available from 1999-01-04

import { APIRequestContext } from "@playwright/test";

export const FX_BASE_URL = "https://api.frankfurter.app";

// Shape of a successful latest/historical rates response
export interface FXRatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Shape of an error response
export interface FXErrorResponse {
  message: string;
}

// Shape of the /currencies endpoint response
export type FXCurrenciesResponse = Record<string, string>;

// Helper: get latest rates for a base currency
export async function getLatestRates(
  request: APIRequestContext,
  baseCurrency = "USD"
): Promise<FXRatesResponse> {
  const response = await request.get(
    `${FX_BASE_URL}/latest?from=${baseCurrency}`
  );
  return response.json() as Promise<FXRatesResponse>;
}

// Helper: get historical rates for a specific date
export async function getHistoricalRates(
  request: APIRequestContext,
  date: string,
  baseCurrency = "USD",
  targetCurrencies: string[] = ["EUR", "GBP", "JPY"]
): Promise<FXRatesResponse> {
  const to = targetCurrencies.join(",");
  const response = await request.get(
    `${FX_BASE_URL}/${date}?from=${baseCurrency}&to=${to}`
  );
  return response.json() as Promise<FXRatesResponse>;
}

// Helper: get list of all available currencies
export async function getAvailableCurrencies(
  request: APIRequestContext
): Promise<FXCurrenciesResponse> {
  const response = await request.get(`${FX_BASE_URL}/currencies`);
  return response.json() as Promise<FXCurrenciesResponse>;
}
