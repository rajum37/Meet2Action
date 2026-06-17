export type MeetingType =
  | 'standup'
  | 'roadmap_review'
  | 'sprint_planning'
  | 'customer_call'
  | 'stakeholder_sync'

export type RiskItemType = 'risk' | 'open_question'

export type MeetingStatus = 'completed' | 'processing' | 'failed'

// ── Row types ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  user_id: string | null
  device_id: string | null
  title: string | null
  meeting_type: MeetingType
  raw_input: string
  status: MeetingStatus
  created_at: string
  updated_at: string
}

export interface MeetingSummary {
  id: string
  meeting_id: string
  summary: string
  created_at: string
}

export interface Decision {
  id: string
  meeting_id: string
  description: string
  sort_order: number
  created_at: string
}

export interface ActionItem {
  id: string
  meeting_id: string
  description: string
  owner_name: string
  due_date: string | null
  sort_order: number
  created_at: string
}

export interface RiskOrQuestion {
  id: string
  meeting_id: string
  item_type: RiskItemType
  description: string
  sort_order: number
  created_at: string
}

export interface NextStep {
  id: string
  meeting_id: string
  description: string
  sort_order: number
  created_at: string
}

// ── Insert types (omit server-generated fields) ────────────────────────────

export type InsertMeeting = Omit<Meeting, 'id' | 'created_at' | 'updated_at'>
export type InsertMeetingSummary = Omit<MeetingSummary, 'id' | 'created_at'>
export type InsertDecision = Omit<Decision, 'id' | 'created_at'>
export type InsertActionItem = Omit<ActionItem, 'id' | 'created_at'>
export type InsertRiskOrQuestion = Omit<RiskOrQuestion, 'id' | 'created_at'>
export type InsertNextStep = Omit<NextStep, 'id' | 'created_at'>

// ── Full meeting result (joined) ───────────────────────────────────────────

export interface MeetingResult {
  meeting: Meeting
  summary: MeetingSummary | null
  decisions: Decision[]
  actionItems: ActionItem[]
  risksAndQuestions: RiskOrQuestion[]
  nextSteps: NextStep[]
}

// ── Supabase Database shape for typed client ──────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      meetings: {
        Row: Meeting
        Insert: InsertMeeting
        Update: Partial<InsertMeeting>
      }
      meeting_summaries: {
        Row: MeetingSummary
        Insert: InsertMeetingSummary
        Update: Partial<InsertMeetingSummary>
      }
      decisions: {
        Row: Decision
        Insert: InsertDecision
        Update: Partial<InsertDecision>
      }
      action_items: {
        Row: ActionItem
        Insert: InsertActionItem
        Update: Partial<InsertActionItem>
      }
      risks_and_questions: {
        Row: RiskOrQuestion
        Insert: InsertRiskOrQuestion
        Update: Partial<InsertRiskOrQuestion>
      }
      next_steps: {
        Row: NextStep
        Insert: InsertNextStep
        Update: Partial<InsertNextStep>
      }
    }
    Enums: {
      meeting_type: MeetingType
      risk_item_type: RiskItemType
    }
  }
}
