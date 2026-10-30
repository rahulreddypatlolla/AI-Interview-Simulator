export interface NavItem {
  label: string
  path: string
  icon?: string
  badge?: string
}

export type AppRoute =
  | '/practice/interviews'
  | '/dashboard'
  | '/interview/setup'
  | '/interview/:sessionId'
  | '/reports'
  | '/reports/:sessionId'
  | '/progress'
  | '/mentor'
  | '/admin'
  | '/settings'
