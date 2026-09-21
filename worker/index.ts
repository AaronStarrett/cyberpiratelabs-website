import { handleInquiryPost, handleOperator, retryDue } from "../shared/inquiry/http";
import type { InquiryEnv } from "../shared/inquiry/http";
import type { Sql, SqlRow } from "../shared/inquiry/types";

export interface Env extends InquiryEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

function d1sql(db: D1Database): Sql {
  return {
    async get<T extends SqlRow>(query: string, ...params: unknown[]) {
      const row = await db.prepare(query).bind(...params).first<T>();
      return row ?? null;
    },
    async all<T extends SqlRow>(query: string, ...params: unknown[]) {
      const result = await db.prepare(query).bind(...params).all<T>();
      return result.results ?? [];
    },
    async run(query: string, ...params: unknown[]) {
      await db.prepare(query).bind(...params).run();
    },
  };
}

function responseFor(result: { status: number; json: Record<string, unknown>; html: string }, request: Request, path: string): Response {
  const wantsCsv = path === "/api/operator/export";
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json") || (request.headers.get("content-type") ?? "").includes("application/json");
  if (wantsCsv && result.status === 200) {
    return new Response(result.html, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"inquiries.csv\"",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
  const body = wantsJson ? JSON.stringify(result.json) : result.html;
  return new Response(body, {
    status: result.status,
    headers: {
      "content-type": wantsJson ? "application/json; charset=utf-8" : "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    try {
      if (path === "/api/inquiries" && request.method === "POST") {
        const result = await handleInquiryPost(request, d1sql(env.DB), env, fetch);
        return responseFor(result, request, path);
      }
      if (path.startsWith("/api/operator")) {
        const result = await handleOperator(request, d1sql(env.DB), env, fetch);
        return responseFor(result, request, path);
      }
      return new Response(JSON.stringify({ ok: false, message: "Not found." }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, message: "The inquiry service failed before saving. Retry." }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    }
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(retryDue(d1sql(env.DB), env, fetch));
  },
} satisfies ExportedHandler<Env>;
