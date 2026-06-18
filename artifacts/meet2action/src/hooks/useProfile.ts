import { useState, useCallback } from "react";

export interface Profile {
  name: string;
  email: string;
  avatar: string;
  isAnonymous: boolean;
}

const PROFILE_KEY = "m2a_profile";

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile | null>(loadProfile);

  const saveProfile = useCallback((p: Profile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {}
    setProfileState(p);
  }, []);

  const clearProfile = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {}
    setProfileState(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}
