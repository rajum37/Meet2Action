export type EventName =
  | "demo_chip_clicked"
  | "generate_started"
  | "generate_completed"
  | "copy_clicked"
  | "export_slack_clicked"
  | "export_email_clicked"
  | "recent_analysis_opened"
  | "save_completed"
  | "keyboard_shortcut_used"
  | "profile_saved"
  | "profile_skipped"
  | "onboarding_complete"
  | "past_meetings_opened"
  | "past_meetings_button_clicked"
  | "past_meeting_detail_opened"
  | "past_meeting_loaded"
  | "use_sample_clicked"
  | "transcript_file_uploaded"
  | "meeting_deleted"
  | "meeting_favorited"
  | "meeting_search_executed";

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, props?: EventProps): void {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, props ?? {});
  }

  if (typeof pendo !== "undefined") {
    pendo.track(name, props ?? {});
  }
}
