export type EventName =
  | "demo_chip_clicked"
  | "generate_started"
  | "generate_completed"
  | "copy_clicked"
  | "export_slack_clicked"
  | "export_email_clicked"
  | "recent_analysis_opened"
  | "save_completed"
  | "keyboard_shortcut_used";

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, props?: EventProps): void {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, props ?? {});
  }
}
