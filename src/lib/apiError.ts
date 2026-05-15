import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function genRequestId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Logs the error server-side with a stable code + requestId, and returns a
 * JSON response that exposes the error message only outside of production.
 * Zod validation errors are returned as 400 with a flattened issue list.
 */
export function respondError(
  err: unknown,
  context: { code: string; status?: number } = { code: 'internal_error' },
): NextResponse {
  const requestId = genRequestId();

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'validation_error',
        requestId,
        issues: err.issues.map(i => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  const status = context.status ?? 500;
  console.error(`[api_error] code=${context.code} requestId=${requestId}`, err);

  const body: Record<string, unknown> = { error: context.code, requestId };
  if (!IS_PRODUCTION && err instanceof Error) {
    body.message = err.message;
  }
  return NextResponse.json(body, { status });
}
