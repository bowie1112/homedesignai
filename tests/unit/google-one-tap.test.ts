import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateGoogleOneTapNonce,
  isFirstSignIn,
  shouldShowGoogleOneTap,
  startGoogleOneTap,
  type GoogleCredentialResponse,
  type GoogleOneTapApi,
  type GoogleOneTapAuthClient,
} from "@/lib/auth/google-one-tap";

afterEach(() => vi.restoreAllMocks());

function setup(options: { session?: unknown; authError?: unknown } = {}) {
  let callback: ((response: GoogleCredentialResponse) => void | Promise<void>) | undefined;
  const google: GoogleOneTapApi = {
    initialize: vi.fn((config) => { callback = config.callback; }),
    prompt: vi.fn(),
    cancel: vi.fn(),
  };
  const supabase: GoogleOneTapAuthClient = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: options.session ?? null }, error: null })),
      signInWithIdToken: vi.fn(async () => ({
        data: { user: { created_at: "2026-07-15T01:00:00.000Z", last_sign_in_at: "2026-07-15T01:00:10.000Z" } },
        error: options.authError ?? null,
      })),
    },
  };
  return { google, supabase, getCallback: () => callback };
}

describe("Google One Tap routes", () => {
  it("includes acquisition pages", () => {
    expect(shouldShowGoogleOneTap("/")).toBe(true);
    expect(shouldShowGoogleOneTap("/pricing")).toBe(true);
    expect(shouldShowGoogleOneTap("/interior-design-ai")).toBe(true);
    expect(shouldShowGoogleOneTap("/ideas/kitchen-layout-ideas")).toBe(true);
    expect(shouldShowGoogleOneTap("/tools/cm-to-feet")).toBe(true);
  });

  it.each(["/auth/sign-in", "/auth/callback", "/account", "/history", "/privacy", "/terms", "/affiliate"])(
    "excludes %s",
    (pathname) => expect(shouldShowGoogleOneTap(pathname)).toBe(false),
  );
});

describe("Google One Tap authentication", () => {
  it("generates a raw nonce and its SHA-256 hash", async () => {
    const { nonce, hashedNonce } = await generateGoogleOneTapNonce();
    const expected = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce))))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    expect(nonce).not.toBe(hashedNonce);
    expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/);
    expect(hashedNonce).toBe(expected);
  });

  it("skips initialization for an existing session", async () => {
    const { google, supabase } = setup({ session: { user: { id: "user-1" } } });
    const cleanup = await startGoogleOneTap({ clientId: "client-id", google, supabase, onAuthenticated: vi.fn() });
    expect(google.initialize).not.toHaveBeenCalled();
    expect(google.prompt).not.toHaveBeenCalled();
    cleanup();
    expect(google.cancel).not.toHaveBeenCalled();
  });

  it("uses the hashed nonce for Google and raw nonce for Supabase", async () => {
    const { google, supabase, getCallback } = setup();
    const onAuthenticated = vi.fn();
    const cleanup = await startGoogleOneTap({ clientId: "client-id", google, supabase, onAuthenticated });
    const config = vi.mocked(google.initialize).mock.calls[0][0];

    expect(config).toMatchObject({ client_id: "client-id", auto_select: false, context: "signin", itp_support: true });
    expect(config.nonce).toMatch(/^[a-f0-9]{64}$/);
    expect(google.prompt).toHaveBeenCalledOnce();

    await getCallback()?.({ credential: "google-id-token" });
    const signInInput = vi.mocked(supabase.auth.signInWithIdToken).mock.calls[0][0];
    expect(signInInput).toMatchObject({ provider: "google", token: "google-id-token" });
    expect(signInInput.nonce).not.toBe(config.nonce);
    expect(onAuthenticated).toHaveBeenCalledWith(true);

    cleanup();
    expect(google.cancel).toHaveBeenCalledOnce();
  });

  it("reports authentication failures without completing login", async () => {
    const { google, supabase, getCallback } = setup({ authError: new Error("denied") });
    const onAuthenticated = vi.fn();
    const onError = vi.fn();
    await startGoogleOneTap({ clientId: "client-id", google, supabase, onAuthenticated, onError });
    await getCallback()?.({ credential: "bad-token" });
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("authenticate");
  });
});

describe("first sign-in classification", () => {
  it("recognizes timestamps within one minute", () => {
    expect(isFirstSignIn({ created_at: "2026-07-15T01:00:00Z", last_sign_in_at: "2026-07-15T01:00:59Z" })).toBe(true);
    expect(isFirstSignIn({ created_at: "2026-07-14T01:00:00Z", last_sign_in_at: "2026-07-15T01:00:00Z" })).toBe(false);
    expect(isFirstSignIn({ created_at: "invalid", last_sign_in_at: "2026-07-15T01:00:00Z" })).toBe(false);
  });
});
