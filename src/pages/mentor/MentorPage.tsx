
import { ArrowRight, UsersRound, Info, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MentorPage() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">HUMAN-IN-THE-LOOP REVIEW</p>
        <h1>Mentor review</h1>
        <p className="page-subtitle">
          A space for authorised reviewers to examine uncertain evaluations
          and leave guidance.
        </p>
      </div>

      <div className="panel empty-state-panel">
        <div className="empty-state-icon">
          <UsersRound size={25} />
        </div>

        <h2>No review tasks connected yet</h2>

        <p>
          Mentor review is not connected to the backend yet. Once reviewer
          authentication and review workflows are implemented, assigned
          evaluation tasks will appear here.
        </p>

        <div className="empty-state-actions">
          <Link to="/dashboard" className="button button-secondary">
            <ArrowRight size={15} /> Return to overview
          </Link>

          <Link to="/progress" className="button button-secondary">
            <FileText size={15} /> View progress
          </Link>
        </div>
      </div>

      <div className="insight-callout">
        <Info size={18} />
        <p>
          <strong>Security note:</strong> Reviewer access must be enforced
          using Supabase Row Level Security, role-based permissions, and
          backend authorisation. Hiding frontend elements alone is not
          sufficient.
        </p>
      </div>
    </div>
  )
}
