export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleOneTapApi = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void | Promise<void>;
    nonce: string;
    auto_select: boolean;
    context: "signin";
    itp_support: boolean;
  }): void;
  prompt(): void;
  cancel(): void;
};

type AuthUser = {
  created_at: string;
  last_sign_in_at?: string | null;
};

export type GoogleOneTapAuthClient = {
  auth: {
    getSession(): Promise<{ data: { session: unknown | null }; error: unknown | null }>;
    signInWithIdToken(input: {
      provider: "google";
      token: string;
      nonce: string;
    }): Promise<{ data: { user: AuthUser | null }; error: unknown | null }>;
  };
};

type StartGoogleOneTapInput = {
  clientId: string;
  google: GoogleOneTapApi;
  supabase: GoogleOneTapAuthClient;
  onAuthenticated: (isNewUser: boolean) => void;
  onError?: (stage: "initialize" | "authenticate") => void;
};

const FIRST_SIGN_IN_WINDOW_MS = 60_000;
const excludedPaths = ["/auth", "/account", "/history"];
const excludedPages = new Set(["/privacy", "/terms", "/affiliate"]);

export function shouldShowGoogleOneTap(pathname: string) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (excludedPages.has(normalized)) return false;
  return !excludedPaths.some((path) => normalized === path || normalized.startsWith(`${path}/`));
}

export async function generateGoogleOneTapNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return { nonce, hashedNonce };
}

export function isFirstSignIn(user: AuthUser | null) {
  if (!user?.last_sign_in_at) return false;
  const createdAt = Date.parse(user.created_at);
  const lastSignInAt = Date.parse(user.last_sign_in_at);
  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) return false;
  return Math.abs(lastSignInAt - createdAt) <= FIRST_SIGN_IN_WINDOW_MS;
}

export async function startGoogleOneTap(input: StartGoogleOneTapInput) {
  const { data, error: sessionError } = await input.supabase.auth.getSession();
  if (sessionError || data.session) return () => undefined;

  let active = true;
  try {
    const { nonce, hashedNonce } = await generateGoogleOneTapNonce();
    input.google.initialize({
      client_id: input.clientId,
      nonce: hashedNonce,
      auto_select: false,
      context: "signin",
      itp_support: true,
      callback: async (response) => {
        if (!active || !response.credential) return;
        try {
          const { data: signInData, error } = await input.supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          });
          if (error) throw error;
          input.onAuthenticated(isFirstSignIn(signInData.user));
        } catch {
          input.onError?.("authenticate");
        }
      },
    });
    input.google.prompt();
  } catch {
    input.onError?.("initialize");
  }

  return () => {
    active = false;
    try {
      input.google.cancel();
    } catch {
      // The Google script can disappear during navigation or browser teardown.
    }
  };
}
