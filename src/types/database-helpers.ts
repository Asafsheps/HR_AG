// ==================================================
// Hand-written aliases over the generated Database type
// ==================================================
// database.ts is OVERWRITTEN by `npm run db:generate-types`; anything added
// to it by hand is lost on the next regen — which already happened once and
// broke the build. Aliases live here instead, where the codegen never
// touches them.

import type { Database } from "./database";

export type DbCandidateStatus = Database["public"]["Enums"]["candidate_status"];
export type DbJobStatus       = Database["public"]["Enums"]["job_status"];

// candidates.gender is a free-text column in the schema, not a Postgres
// enum, so the accepted values are defined at the application level.
export type DbGender = "male" | "female" | "other" | "undisclosed";
