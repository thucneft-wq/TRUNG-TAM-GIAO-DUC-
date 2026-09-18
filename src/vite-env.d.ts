/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_ENDPOINT?: string;
  readonly VITE_COUNSELORS_ENDPOINT?: string;
  readonly VITE_COUNSELOR_DETAIL_ENDPOINT?: string;
  readonly VITE_DASHBOARD_ENDPOINT?: string;
  readonly VITE_ANALYTICS_FILTERS_ENDPOINT?: string;
  readonly VITE_STUDENT_TRENDS_ENDPOINT?: string;
  readonly VITE_FEEDBACK_ANALYTICS_ENDPOINT?: string;
  readonly VITE_ANALYTICS_EXPORT_ENDPOINT?: string;
  readonly VITE_AUDIT_LOGS_ENDPOINT?: string;
  readonly VITE_STUDENTS_ENDPOINT?: string;
  readonly VITE_SHEET_MIRROR_ENDPOINT?: string;
  readonly VITE_CRUD_DEMO_MODE?: string;
  readonly VITE_GOOGLE_STUDENT_FORM_URL?: string;
  readonly VITE_GOOGLE_STUDENT_ENTRY_URL?: string;
  readonly VITE_GOOGLE_STUDENT_THCS_ENTRY_URL?: string;
  readonly VITE_GOOGLE_STUDENT_THPT_ENTRY_URL?: string;
  readonly VITE_GOOGLE_STUDENT_THCS_SHEET_URL?: string;
  readonly VITE_GOOGLE_STUDENT_THPT_SHEET_URL?: string;
  readonly VITE_GOOGLE_COUNSELOR_ENTRY_URL?: string;
  readonly VITE_STUDENT_SYNC_INTERVAL_MS?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_KNOWLEDGE_GRAPH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
