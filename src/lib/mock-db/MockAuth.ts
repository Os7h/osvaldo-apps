// Fake auth that always returns a demo user session

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@portfolio.dev",
  role: "admin",
  user_metadata: { full_name: "Demo User" },
  app_metadata: { role: "admin" },
};

const DEMO_SESSION = {
  user: DEMO_USER,
  access_token: "demo-token",
  refresh_token: "demo-refresh",
  expires_at: Date.now() / 1000 + 86400,
  expires_in: 86400,
  token_type: "bearer",
};

type AuthCallback = (event: string, session: unknown) => void;

export class MockAuth {
  private listeners: AuthCallback[] = [];

  async getSession() {
    return { data: { session: DEMO_SESSION }, error: null };
  }

  async getUser() {
    return { data: { user: DEMO_USER }, error: null };
  }

  async signInWithPassword(_creds: { email: string; password: string }) {
    return { data: { user: DEMO_USER, session: DEMO_SESSION }, error: null };
  }

  async signUp(_creds: { email: string; password: string }) {
    return { data: { user: DEMO_USER, session: DEMO_SESSION }, error: null };
  }

  async signOut() {
    return { error: null };
  }

  onAuthStateChange(callback: AuthCallback) {
    this.listeners.push(callback);
    // Fire immediately with SIGNED_IN
    setTimeout(() => callback("SIGNED_IN", DEMO_SESSION), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }
}
