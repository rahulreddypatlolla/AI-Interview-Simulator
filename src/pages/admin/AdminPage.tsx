
import {
  ArrowRight,
  ShieldCheck,
  Database,
  ClipboardList,
  Activity,
  Info,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const adminFeatures = [
  {
    title: 'Question bank',
    description:
      'Manage versioned, role-specific interview questions and evaluation rubrics.',
    icon: ClipboardList,
  },
  {
    title: 'Scoring versions',
    description:
      'Maintain scoring criteria and track rubric versions for research reproducibility.',
    icon: Database,
  },
  {
    title: 'Audit events',
    description:
      'Track important administrative activities and sensitive configuration changes.',
    icon: Activity,
  },
]

export default function AdminPage() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">SYSTEM WORKSPACE</p>
        <h1>Administration</h1>
        <p className="page-subtitle">
          Manage approved question sets, scoring versions, and operational
          settings.
        </p>
      </div>

      <div className="panel empty-state-panel">
        <div className="empty-state-icon">
          <ShieldCheck size={25} />
        </div>

        <h2>Administration is not connected</h2>

        <p>
          The admin workspace is prepared for protected administrative
          workflows. Connect the Supabase backend and configure administrator
          permissions to enable these features.
        </p>

        <Link to="/dashboard" className="button button-secondary">
          Return to overview <ArrowRight size={15} />
        </Link>
      </div>

      <div className="admin-feature-grid">
        {adminFeatures.map((feature) => {
          const Icon = feature.icon

          return (
            <div className="panel" key={feature.title}>
              <div className="panel-heading">
                <h3>{feature.title}</h3>
                <Icon size={19} className="panel-heading-icon" />
              </div>

              <p>{feature.description}</p>

              <span className="coming-soon">Planned integration</span>
            </div>
          )
        })}
      </div>

      <div className="insight-callout">
        <Info size={18} />
        <p>
          <strong>Security requirement:</strong> Admin operations must be
          protected using verified user roles, Supabase Row Level Security,
          and server-side authorization. Do not rely only on frontend route
          protection.
        </p>
      </div>
    </div>
  )
}
