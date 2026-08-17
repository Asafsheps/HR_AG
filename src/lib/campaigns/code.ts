// ==================================================
// Campaign codes
// ==================================================
// The code lives in the landing-page URL (/j/A7K2M), so it is read aloud,
// retyped from a screenshot, and pasted into posts. That rules out any
// character pair a person can confuse.

import { randomInt } from "crypto";

// No 0/O, no 1/I/L, no 5/S, no 8/B. What remains is unambiguous in every
// common font, which matters when someone retypes a code from a phone.
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY2346789";

const CODE_LENGTH = 5;

/**
 * Generate a campaign code.
 *
 * Uses crypto.randomInt rather than Math.random: the code is the public
 * handle for a job, and a guessable sequence would let anyone enumerate
 * campaigns that are not theirs.
 */
export function generateCampaignCode(length = CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** Matches the campaigns_code_format CHECK constraint. */
export function isValidCampaignCode(code: string): boolean {
  return /^[A-Z0-9]{3,12}$/.test(code);
}

/**
 * Build the public landing URL for a code.
 *
 * Falls back to a relative path when NEXT_PUBLIC_APP_URL is unset, which
 * keeps the link usable in local development instead of producing a
 * confident but wrong absolute URL.
 */
export function landingUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return base ? `${base}/j/${code}` : `/j/${code}`;
}
