// ==================================================
// Global API Error Handler
// Phase 12: Production Hardening
// ==================================================
// Wraps API route handlers to:
//  1. Catch unhandled errors without exposing stack traces
//  2. Log structured error info server-side
//  3. Return safe JSON responses in production
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";

type RouteHandler = (
  request: NextRequest,
  context:  { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

const isDev = process.env.NODE_ENV === "development";

function logError(error: unknown, request: NextRequest) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(JSON.stringify({
    level:   "ERROR",
    ts:      new Date().toISOString(),
    method:  request.method,
    path:    request.nextUrl.pathname,
    message: err.message,
    ...(isDev ? { stack: err.stack } : {}),
  }));
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      logError(error, request);

      const message = isDev && error instanceof Error
        ? error.message
        : "שגיאת שרת פנימית — נסה שוב מאוחר יותר";

      return NextResponse.json(
        apiError(message, "INTERNAL_ERROR"),
        { status: 500 }
      );
    }
  };
}

// Simpler version for routes without dynamic params
export function safeHandler(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      logError(error, req);
      const message = isDev && error instanceof Error
        ? error.message
        : "שגיאת שרת פנימית — נסה שוב מאוחר יותר";
      return NextResponse.json(apiError(message, "INTERNAL_ERROR"), { status: 500 });
    }
  };
}
