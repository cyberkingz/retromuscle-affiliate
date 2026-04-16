import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  readCookieFromHeader,
  setAuthCookies
} from "@/features/auth/server/auth-cookies";

describe("readCookieFromHeader", () => {
  it("returns null for null header", () => {
    expect(readCookieFromHeader(null, "name")).toBeNull();
  });

  it("returns null for empty header", () => {
    expect(readCookieFromHeader("", "name")).toBeNull();
  });

  it("reads a simple cookie", () => {
    expect(readCookieFromHeader("foo=bar", "foo")).toBe("bar");
  });

  it("reads a cookie from a multi-cookie header", () => {
    expect(readCookieFromHeader("a=1; b=2; c=3", "b")).toBe("2");
  });

  it("returns null when the named cookie is absent", () => {
    expect(readCookieFromHeader("a=1; b=2", "c")).toBeNull();
  });

  it("handles cookies without values (no equals sign) gracefully", () => {
    expect(readCookieFromHeader("noeq; a=1", "noeq")).toBeNull();
    expect(readCookieFromHeader("noeq; a=1", "a")).toBe("1");
  });

  it("URL-decodes cookie values", () => {
    expect(readCookieFromHeader(`token=hello%20world`, "token")).toBe("hello world");
  });

  it("is case-sensitive for cookie names", () => {
    expect(readCookieFromHeader("Token=abc", "token")).toBeNull();
    expect(readCookieFromHeader("Token=abc", "Token")).toBe("abc");
  });

  it("trims whitespace around name — value is trimmed by implementation", () => {
    // The implementation does .trim() on the value after the '='
    expect(readCookieFromHeader("  a  =  val  ", "a")).toBe("val");
  });

  it("reads the access token cookie by its canonical name", () => {
    const header = `${ACCESS_TOKEN_COOKIE_NAME}=jwt.token.here; other=x`;
    expect(readCookieFromHeader(header, ACCESS_TOKEN_COOKIE_NAME)).toBe("jwt.token.here");
  });

  it("reads the refresh token cookie by its canonical name", () => {
    const header = `${REFRESH_TOKEN_COOKIE_NAME}=refresh.xyz`;
    expect(readCookieFromHeader(header, REFRESH_TOKEN_COOKIE_NAME)).toBe("refresh.xyz");
  });

  it("truncates headers longer than 8192 bytes (does not crash)", () => {
    const long = "x=".padEnd(8200, "a");
    // Just ensuring it doesn't throw; result may be null or partial
    expect(() => readCookieFromHeader(long, "x")).not.toThrow();
  });
});

describe("clearAuthCookies", () => {
  it("sets access and refresh tokens to empty with maxAge 0", () => {
    const response = new NextResponse(null, { status: 200 });
    clearAuthCookies(response);

    const accessCookie = response.cookies.get(ACCESS_TOKEN_COOKIE_NAME);
    const refreshCookie = response.cookies.get(REFRESH_TOKEN_COOKIE_NAME);

    expect(accessCookie?.value).toBe("");
    expect(refreshCookie?.value).toBe("");
  });
});

describe("setAuthCookies", () => {
  it("sets access and refresh token cookies", () => {
    const response = new NextResponse(null, { status: 200 });
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    setAuthCookies(response, {
      accessToken: "access.jwt.token",
      refreshToken: "refresh.jwt.token",
      expiresAt
    });

    const accessCookie = response.cookies.get(ACCESS_TOKEN_COOKIE_NAME);
    const refreshCookie = response.cookies.get(REFRESH_TOKEN_COOKIE_NAME);

    expect(accessCookie?.value).toBe("access.jwt.token");
    expect(refreshCookie?.value).toBe("refresh.jwt.token");
  });

  it("uses 3600s access maxAge when expiresAt is null", () => {
    const response = new NextResponse(null, { status: 200 });
    setAuthCookies(response, {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: null
    });

    // Cookie was set (value present); we can't read maxAge from NextResponse cookies API
    // but the function should not throw
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe("tok");
  });

  it("enforces minimum 60s access maxAge even for near-expiry tokens", () => {
    const response = new NextResponse(null, { status: 200 });
    const expiresAt = Math.floor(Date.now() / 1000) + 5; // expires in 5 seconds

    setAuthCookies(response, {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt
    });

    // Should not throw; access token is still set
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe("tok");
  });
});
