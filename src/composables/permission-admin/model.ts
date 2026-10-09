export function sameIds(a: string[] = [], b: string[] = []): boolean {
  return a.length === b.length && a.every(id => b.includes(id));
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
