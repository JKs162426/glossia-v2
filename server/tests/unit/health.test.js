import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("API smoke test", () => {
  it("GET /api/health responds 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Glossia API running" });
  });

  it("unknown API routes respond 404 with JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Route not found");
  });

  it("sends security headers and hides Express", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers["strict-transport-security"]).toMatch(/max-age=\d+/);
  });

  it("allows styles, fonts and scripts only from the site itself", async () => {
    const res = await request(app).get("/api/health");
    const policy = Object.fromEntries(
      res.headers["content-security-policy"].split(";").map((d) => {
        const [name, ...values] = d.trim().split(/\s+/);
        return [name, values];
      }),
    );
    expect(policy["style-src"]).toEqual(["'self'"]);
    expect(policy["font-src"]).toEqual(["'self'"]);
    expect(policy["script-src"]).toEqual(["'self'"]);
    expect(policy["connect-src"]).toEqual(["'self'", "https://api.mymemory.translated.net"]);
    expect(res.headers["content-security-policy"]).not.toContain("unsafe-inline");
  });
});
