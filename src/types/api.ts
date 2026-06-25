export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Project {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface TestSuite {
  id: number
  project_id: number
  name: string
  description: string
  draft_revision: number
  created_at: string
  updated_at: string
}

export interface Environment {
  id: number
  name: string
  base_url: string
  headers: Record<string, JsonValue>
  variables: Record<string, JsonValue>
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface StatusCodeAssertion {
  type: 'status_code'
  operator: 'equals'
  expected: number
}

export interface JsonValueAssertion {
  type: 'json_value'
  path: string
  operator: 'equals'
  expected: JsonValue
}

export interface JsonTypeAssertion {
  type: 'json_type'
  path: string
  operator: 'is'
  expected: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
}

export type CaseAssertion = StatusCodeAssertion | JsonValueAssertion | JsonTypeAssertion

export interface CaseExtractor {
  name: string
  path: string
}

export interface ApiCase {
  id: number
  project_id: number
  name: string
  method: HttpMethod
  path: string
  headers: Record<string, JsonValue>
  query: Record<string, JsonValue>
  body: JsonValue
  assertions: CaseAssertion[]
  extractors: CaseExtractor[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export type ApiCasePayload = Omit<ApiCase, 'id' | 'created_at' | 'updated_at'>

export interface SuiteStep {
  id: number
  suite_id: number
  case_id: number
  position: number
  enabled: boolean
  created_at: string
  case: ApiCase
}

export interface SuiteStepsResponse {
  suite: TestSuite
  steps: SuiteStep[]
}

export interface SuiteVersion {
  id: number
  suite_id: number
  version_number: number
  source_revision: number
  snapshot: Record<string, unknown>
  change_summary: string
  created_at: string
}

export interface VersionDiff {
  from_version_id: number
  to_version_id: number
  suite_changes: Record<string, { from: unknown; to: unknown }>
  added_steps: Record<string, unknown>[]
  removed_steps: Record<string, unknown>[]
  reordered_steps: Record<string, unknown>[]
  changed_cases: Record<string, unknown>[]
}

export type RunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'CANCELLED'
  | 'ERROR'
  | 'INTERRUPTED'

export interface TestRun {
  id: number
  project_id: number | null
  suite_id: number | null
  suite_version_id: number | null
  draft_revision: number | null
  environment_id: number | null
  source_type: 'FORM_SUITE' | 'PYTHON_TESTS'
  status: RunStatus
  total: number
  completed: number
  passed: number
  failed: number
  skipped: number
  created_at: string
  started_at: string | null
  finished_at: string | null
  cancel_requested_at: string | null
  error_message: string | null
}

export interface CaseResult {
  id: number
  run_id: number
  case_key: string
  case_name: string
  sequence: number
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR'
  duration_ms: number
  request: Record<string, unknown> | null
  response: Record<string, unknown> | null
  assertions: Record<string, unknown>[]
  extracted_variables: Record<string, unknown>
  error_message: string | null
}

export interface ApiErrorResponse {
  code: string
  message: string
  details: Record<string, unknown>
}

export type RunEvent =
  | { type: 'run_snapshot'; run: TestRun }
  | { type: 'collection_started'; total: number }
  | { type: 'case_started'; case_key: string; name?: string; sequence?: number }
  | {
      type: 'case_finished'
      case_key: string
      name?: string
      status: CaseResult['status']
      duration_ms?: number
      error?: string | null
    }
  | { type: 'case_log'; message: string; level?: string }
  | { type: 'run_finished'; status: RunStatus }
