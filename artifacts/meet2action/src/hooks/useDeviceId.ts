import { useMemo } from "react";
import { getOrCreateDeviceId } from "@/lib/deviceId";

export function useDeviceId(): string {
  return useMemo(() => getOrCreateDeviceId(), []);
}
