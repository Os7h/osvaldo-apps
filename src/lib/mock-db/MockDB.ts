import { MockQueryBuilder } from "./MockQueryBuilder";
import { MockAuth } from "./MockAuth";
import { getTable } from "./storage";

export class MockDB {
  public auth: MockAuth;
  private prefix: string;
  private rpcHandlers: Map<string, (args: Record<string, unknown>) => unknown>;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.auth = new MockAuth();
    this.rpcHandlers = new Map();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): MockQueryBuilder<any> {
    return new MockQueryBuilder(this.prefix, table);
  }

  // Register a custom RPC handler
  registerRpc(name: string, handler: (args: Record<string, unknown>) => unknown): void {
    this.rpcHandlers.set(name, handler);
  }

  // Call an RPC function
  async rpc(name: string, args?: Record<string, unknown>) {
    const handler = this.rpcHandlers.get(name);
    if (handler) {
      try {
        const data = handler(args ?? {});
        return { data, error: null };
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } };
      }
    }
    return { data: null, error: { message: `RPC function "${name}" not found` } };
  }

  // Channel subscription stub (no-op for demo)
  channel(_name: string) {
    return {
      on: () => ({ on: () => ({ subscribe: () => {} }) }),
      subscribe: () => {},
      unsubscribe: () => {},
    };
  }

  // Helper: get raw table data for seed/debug
  getTableData<T>(table: string): T[] {
    return getTable<T>(this.prefix, table);
  }

  // Storage stub
  storage = {
    from: (_bucket: string) => ({
      upload: async () => ({ data: { path: "demo/file.png" }, error: null }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://demo.storage/${path}` },
      }),
      download: async () => ({ data: new Blob(), error: null }),
      remove: async () => ({ data: null, error: null }),
    }),
  };

  // Functions stub
  functions = {
    invoke: async (name: string, _options?: unknown) => {
      console.log(`[MockDB] Edge function "${name}" called (demo mode — no-op)`);
      return { data: { success: true }, error: null };
    },
  };
}
