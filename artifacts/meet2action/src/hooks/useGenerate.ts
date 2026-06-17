import { useState, useCallback, useRef } from "react";
import { generateFromTranscript, type ParsedMeeting } from "@/lib/generation";

export interface StepInfo {
  step: number;
  label: string;
  complete: boolean;
}

export const STEP_LABELS = [
  "Reading transcript…",
  "Identifying decisions…",
  "Mapping action items to owners…",
  "Scanning for risks & open questions…",
  "Drafting next steps…",
] as const;

const STEP_DURATION_MS = 480;

interface UseGenerateResult {
  isLoading: boolean;
  data: ParsedMeeting | null;
  error: string | null;
  activeStep: number;
  completedSteps: number;
  progressSteps: StepInfo[];
  generate: (transcript: string, meetingType: string) => Promise<void>;
  reset: () => void;
}

export function useGenerate(): UseGenerateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ParsedMeeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState(0);
  const abortRef = useRef(false);

  const generate = useCallback(async (transcript: string, meetingType: string) => {
    abortRef.current = false;
    setIsLoading(true);
    setData(null);
    setError(null);
    setActiveStep(0);
    setCompletedSteps(0);

    const resultPromise = generateFromTranscript(transcript, meetingType);

    for (let i = 0; i < STEP_LABELS.length; i++) {
      if (abortRef.current) return;
      setActiveStep(i);
      await new Promise<void>((resolve) => setTimeout(resolve, STEP_DURATION_MS));
      if (abortRef.current) return;
      setCompletedSteps(i + 1);
    }

    setActiveStep(-1);

    try {
      const result = await resultPromise;
      if (!abortRef.current) setData(result);
    } catch (err) {
      if (!abortRef.current)
        setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      if (!abortRef.current) setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setIsLoading(false);
    setData(null);
    setError(null);
    setActiveStep(-1);
    setCompletedSteps(0);
  }, []);

  const progressSteps: StepInfo[] = STEP_LABELS.map((label, i) => ({
    step: i,
    label,
    complete: i < completedSteps,
  }));

  return {
    isLoading,
    data,
    error,
    activeStep,
    completedSteps,
    progressSteps,
    generate,
    reset,
  };
}
