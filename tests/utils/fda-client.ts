// tests/utils/fda-client.ts
//
// Type definitions and helper functions for the FDA Drug API (OpenFDA).
//
// Documentation: https://open.fda.gov/apis/drug/
//
// Business context: The FDA Drug API is the upstream public data source
// for CMS Medicare Part D analytics. Drug adverse event data, recalls,
// and labeling are the raw material for adherence analytics, Star Ratings
// monitoring, and pharmacy outreach prioritization.
// This connects to the medicare-partd-adherence-gap project.
//
// API properties:
//   - Free to use, no API key required (rate limited at 240 req/min)
//   - Covers adverse events, recalls (enforcement), and labeling
//   - Updated regularly from FDA source systems

import { APIRequestContext } from "@playwright/test";

export const FDA_BASE_URL = "https://api.fda.gov";

// Meta block that appears in every FDA API response
export interface FDAMeta {
  disclaimer: string;
  terms: string;
  license: string;
  last_updated: string;
  results: {
    skip: number;
    limit: number;
    total: number;
  };
}

// Single drug adverse event record
export interface FDAAdverseEvent {
  safetyreportid: string;
  receivedate: string;
  patient?: {
    drug?: Array<{
      medicinalproduct?: string;
      drugindication?: string;
    }>;
    reaction?: Array<{
      reactionmeddrapt?: string;
    }>;
  };
}

// Full adverse event API response
export interface FDAEventResponse {
  meta: FDAMeta;
  results: FDAAdverseEvent[];
}

// Single drug recall record
export interface FDARecall {
  recall_number: string;
  status: string;
  product_description: string;
  classification: "Class I" | "Class II" | "Class III";
  recalling_firm: string;
  reason_for_recall: string;
  recall_initiation_date: string;
}

// Full enforcement (recalls) API response
export interface FDAEnforcementResponse {
  meta: FDAMeta;
  results: FDARecall[];
}

// Single drug label record
export interface FDALabelResult {
  id: string;
  warnings?: string[];
  warnings_and_cautions?: string[];
  indications_and_usage?: string[];
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
  };
}

// Full drug label API response
export interface FDALabelResponse {
  meta: FDAMeta;
  results: FDALabelResult[];
}

// Helper: search drug adverse events by drug name
export async function searchAdverseEvents(
  request: APIRequestContext,
  drugName: string,
  limit = 5
): Promise<FDAEventResponse> {
  const response = await request.get(
    `${FDA_BASE_URL}/drug/event.json?search=patient.drug.medicinalproduct:"${drugName}"&limit=${limit}`
  );
  return response.json() as Promise<FDAEventResponse>;
}

// Helper: get drug recalls (enforcement actions)
export async function getDrugRecalls(
  request: APIRequestContext,
  limit = 5
): Promise<FDAEnforcementResponse> {
  const response = await request.get(
    `${FDA_BASE_URL}/drug/enforcement.json?limit=${limit}`
  );
  return response.json() as Promise<FDAEnforcementResponse>;
}

// Helper: search drug labeling by brand name
export async function searchDrugLabels(
  request: APIRequestContext,
  brandName: string,
  limit = 3
): Promise<FDALabelResponse> {
  const response = await request.get(
    `${FDA_BASE_URL}/drug/label.json?search=openfda.brand_name:"${brandName}"&limit=${limit}`
  );
  return response.json() as Promise<FDALabelResponse>;
}
