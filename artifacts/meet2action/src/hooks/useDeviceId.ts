import { useMemo } from "react";

const KEY = "m2a_device_id";

function getOrCreate(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}

export function useDeviceId(): string {
  return useMemo(() => getOrCreate(), []);
}
