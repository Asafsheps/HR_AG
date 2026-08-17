// ==================================================
// Interview sessions
// ==================================================
// A candidate starts chatting before they exist as a record anywhere, so a
// session is keyed by an opaque token rather than by a user id.
//
// Two backends:
//   demo — in-process Map, so the whole funnel is testable with no
//          database. Lost on restart, which is correct for demo data.
//   real — conversation_contexts (migration 014 added channel and
//          session_token for exactly this).
//
// The demo store is deliberately simple. It is not a cache to grow
// features on; when Supabase is wired up, `real` becomes the only path.

import { randomBytes } from "crypto";
import type { AgentConfig, JobConfig } from "./prompt";

export interface InterviewTurn {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface InterviewSession {
  token:      string;
  campaignCode: string;
  jobId:      string;

  candidate: {
    full_name: string;
    phone:     string;
    email:     string;
  };

  cvText:     string;
  cvFileName: string | null;

  agent: AgentConfig;
  job:   JobConfig;

  turns:  InterviewTurn[];
  /** Injection signals seen across the session, for human review. */
  flags:  { id: string; excerpt: string; at: string }[];

  startedAt: string;
  endedAt:   string | null;
}

/** Opaque, unguessable, URL-safe. */
export function newSessionToken(): string {
  return randomBytes(24).toString("base64url");
}

// ── Demo store ────────────────────────────────────────────────────────
// Held on globalThis, not in a module-level const.
//
// Next.js compiles each route into its own module graph, so a plain
// module-scoped Map is NOT shared between /api/interview/start and
// /api/interview/[token]/message — the session written by one is invisible
// to the other, and every interview 404s on its first message. HMR
// re-evaluating the module has the same effect.
//
// This is a dev-only store for demo mode. Production persistence goes to
// conversation_contexts.
const globalStore = globalThis as unknown as {
  __hrAgDemoSessions?: Map<string, InterviewSession>;
};

globalStore.__hrAgDemoSessions ??= new Map<string, InterviewSession>();
const demoSessions = globalStore.__hrAgDemoSessions;

/** Sessions older than this are dropped so the map cannot grow unbounded. */
const DEMO_TTL_MS = 6 * 60 * 60 * 1000;

function pruneDemoSessions() {
  const cutoff = Date.now() - DEMO_TTL_MS;
  for (const [token, s] of demoSessions) {
    if (new Date(s.startedAt).getTime() < cutoff) demoSessions.delete(token);
  }
}

export function saveDemoSession(session: InterviewSession): void {
  pruneDemoSessions();
  demoSessions.set(session.token, session);
}

export function getDemoSession(token: string): InterviewSession | undefined {
  return demoSessions.get(token);
}

export function appendDemoTurn(token: string, turn: InterviewTurn): void {
  const s = demoSessions.get(token);
  if (s) s.turns.push(turn);
}

export function endDemoSession(token: string): void {
  const s = demoSessions.get(token);
  if (s) s.endedAt = new Date().toISOString();
}

export function flagDemoSession(
  token: string,
  signals: { id: string; excerpt: string }[],
): void {
  const s = demoSessions.get(token);
  if (!s || signals.length === 0) return;
  const at = new Date().toISOString();
  s.flags.push(...signals.map(sig => ({ ...sig, at })));
}
