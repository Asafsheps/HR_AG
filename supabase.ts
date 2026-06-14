/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

// Sanitize URL if user copied the REST API endpoint URL by mistake
if (supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length - 9);
} else if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.substring(0, supabaseUrl.length - 8);
}

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http") || supabaseUrl === "YOUR_SUPABASE_PROJECT_URL") {
  console.warn("\n=====================================================================");
  console.warn("⚠️ WARNING: Invalid or missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  console.warn("Please configure actual credentials in your .env file to enable CRM persistence.");
  console.warn("Currently running with a mock client to prevent server startup crashes.");
  console.warn("=====================================================================\n");

  // Mock client that returns descriptive errors instead of crashing the server
  const mockDBResult = {
    select: () => Promise.resolve({ data: [], error: new Error("Supabase credentials not configured in .env") }),
    upsert: () => Promise.resolve({ data: [], error: new Error("Supabase credentials not configured in .env") }),
    delete: () => Promise.resolve({ data: [], error: new Error("Supabase credentials not configured in .env") }),
    eq: () => mockDBResult,
    single: () => Promise.resolve({ data: null, error: new Error("Supabase credentials not configured in .env") }),
    maybeSingle: () => Promise.resolve({ data: null, error: new Error("Supabase credentials not configured in .env") }),
    order: () => mockDBResult
  };

  supabase = {
    from: () => mockDBResult
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
