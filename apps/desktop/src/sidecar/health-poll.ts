import type { HealthResponse } from '@operon/shared-types';

export interface PollHealthOptions {
  maxAttempts?: number;
  intervalMs?: number;
  fetchFn?: typeof fetch;
}

export async function pollSidecarHealth(
  baseUrl: string,
  options: PollHealthOptions = {},
): Promise<HealthResponse> {
  const { maxAttempts = 15, intervalMs = 200, fetchFn = fetch } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchFn(`${baseUrl}/health`);
      if (res.ok) {
        const body = (await res.json()) as HealthResponse;
        if (body.status === 'ok') return body;
      }
    } catch {
      // Sidecar still starting
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  throw new Error(`Sidecar health check failed after ${maxAttempts} attempts`);
}

export function sidecarBaseUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}
