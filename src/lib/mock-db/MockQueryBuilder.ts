import { getTable, setTable } from "./storage";

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

interface OrderBy {
  column: string;
  ascending: boolean;
}

interface MockResult<T> {
  data: T | T[] | null;
  error: null | { message: string };
  count?: number;
}

export class MockQueryBuilder<T extends Record<string, unknown>> {
  private prefix: string;
  private table: string;
  private filters: Filter[] = [];
  private orders: OrderBy[] = [];
  private limitCount: number | null = null;
  private offsetCount: number = 0;
  // @ts-expect-error reserved for future column filtering
  private _selectColumns: string = "*";
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Partial<T> | Partial<T>[] | null = null;
  private singleResult = false;
  private countMode: "exact" | null = null;

  constructor(prefix: string, table: string) {
    this.prefix = prefix;
    this.table = table;
  }

  select(columns: string = "*", options?: { count?: "exact" }): this {
    this.mode = "select";
    this._selectColumns = columns;
    if (options?.count) this.countMode = options.count;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this.mode = "insert";
    this.payload = data;
    return this;
  }

  update(data: Partial<T>): this {
    this.mode = "update";
    this.payload = data;
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[]): this {
    this.mode = "upsert";
    this.payload = data;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  like(column: string, value: string): this {
    this.filters.push({ column, op: "like", value });
    return this;
  }

  ilike(column: string, value: string): this {
    this.filters.push({ column, op: "ilike", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): this {
    this.singleResult = true;
    return this;
  }

  // Execute the query — this is called via `then` automatically when awaited
  async then<TResult>(
    resolve: (value: MockResult<T>) => TResult,
    reject?: (reason: unknown) => TResult
  ): Promise<TResult> {
    try {
      const result = this.execute();
      return resolve(result);
    } catch (e) {
      if (reject) return reject(e);
      throw e;
    }
  }

  private execute(): MockResult<T> {
    switch (this.mode) {
      case "select":
        return this.executeSelect();
      case "insert":
        return this.executeInsert();
      case "update":
        return this.executeUpdate();
      case "upsert":
        return this.executeUpsert();
      case "delete":
        return this.executeDelete();
      default:
        return { data: null, error: { message: `Unknown mode: ${this.mode}` } };
    }
  }

  private applyFilters(rows: T[]): T[] {
    return rows.filter((row) => {
      return this.filters.every((f) => {
        const val = row[f.column];
        switch (f.op) {
          case "eq":
            return val === f.value;
          case "neq":
            return val !== f.value;
          case "gt":
            return (val as number) > (f.value as number);
          case "gte":
            return (val as number) >= (f.value as number);
          case "lt":
            return (val as number) < (f.value as number);
          case "lte":
            return (val as number) <= (f.value as number);
          case "like":
            return String(val).includes(String(f.value).replace(/%/g, ""));
          case "ilike":
            return String(val)
              .toLowerCase()
              .includes(String(f.value).replace(/%/g, "").toLowerCase());
          case "in":
            return (f.value as unknown[]).includes(val);
          case "is":
            if (f.value === null) return val === null || val === undefined;
            return val === f.value;
          default:
            return true;
        }
      });
    });
  }

  private applyOrders(rows: T[]): T[] {
    if (this.orders.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const ord of this.orders) {
        const aVal = a[ord.column];
        const bVal = b[ord.column];
        if (aVal === bVal) continue;
        if (aVal == null) return ord.ascending ? -1 : 1;
        if (bVal == null) return ord.ascending ? 1 : -1;
        const cmp = aVal < bVal ? -1 : 1;
        return ord.ascending ? cmp : -cmp;
      }
      return 0;
    });
  }

  private executeSelect(): MockResult<T> {
    let rows = getTable<T>(this.prefix, this.table);
    rows = this.applyFilters(rows);
    rows = this.applyOrders(rows);
    const totalCount = rows.length;

    if (this.offsetCount > 0) {
      rows = rows.slice(this.offsetCount);
    }
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    if (this.singleResult) {
      if (rows.length === 0) {
        return { data: null, error: null };
      }
      const result: MockResult<T> = { data: rows[0], error: null };
      if (this.countMode) result.count = totalCount;
      return result;
    }

    const result: MockResult<T> = { data: rows, error: null };
    if (this.countMode) result.count = totalCount;
    return result;
  }

  private executeInsert(): MockResult<T> {
    const rows = getTable<T>(this.prefix, this.table);
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];

    const newRows = items.map((item) => {
      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...item,
      } as unknown as T;
      return row;
    });

    rows.push(...newRows);
    setTable(this.prefix, this.table, rows);

    if (this.singleResult) {
      return { data: newRows[0], error: null };
    }
    return { data: newRows as unknown as T[], error: null };
  }

  private executeUpdate(): MockResult<T> {
    const rows = getTable<T>(this.prefix, this.table);
    const matching = this.applyFilters(rows);
    const matchIds = new Set(matching.map((r) => r.id));

    const updated = rows.map((row) => {
      if (matchIds.has(row.id)) {
        return { ...row, ...(this.payload as Partial<T>), updated_at: new Date().toISOString() };
      }
      return row;
    });

    setTable(this.prefix, this.table, updated);

    const result = updated.filter((r) => matchIds.has(r.id));
    if (this.singleResult) {
      return { data: result[0] ?? null, error: null };
    }
    return { data: result as unknown as T[], error: null };
  }

  private executeUpsert(): MockResult<T> {
    const rows = getTable<T>(this.prefix, this.table);
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];

    for (const item of items) {
      const idx = rows.findIndex((r) => r.id === (item as T).id);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
      } else {
        rows.push({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...item,
        } as unknown as T);
      }
    }

    setTable(this.prefix, this.table, rows);
    return { data: items as unknown as T[], error: null };
  }

  private executeDelete(): MockResult<T> {
    const rows = getTable<T>(this.prefix, this.table);
    const matching = this.applyFilters(rows);
    const matchIds = new Set(matching.map((r) => r.id));
    const remaining = rows.filter((r) => !matchIds.has(r.id));
    setTable(this.prefix, this.table, remaining);
    return { data: matching as unknown as T[], error: null };
  }
}
