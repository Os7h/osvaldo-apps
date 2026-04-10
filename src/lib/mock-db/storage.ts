// localStorage helpers with namespace prefixes

export function getTable<T>(prefix: string, table: string): T[] {
  const key = `${prefix}_${table}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function setTable<T>(prefix: string, table: string, data: T[]): void {
  const key = `${prefix}_${table}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function isSeeded(prefix: string): boolean {
  return localStorage.getItem(`${prefix}_seeded`) === "true";
}

export function markSeeded(prefix: string): void {
  localStorage.setItem(`${prefix}_seeded`, "true");
}

export function clearAppData(prefix: string): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${prefix}_`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
