import { ArrowRight, AudioLines, BarChart3, BrainCircuit, CheckCircle2, Clock3, Code2, MessageSquareText, Mic2, Play, Sparkles, Target, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sessions } from '../../data/mockData'

const formats = [
  { title: 'Technical interview', detail: 'Concepts, debugging, and problem solving', icon: Code2, time: '20–30 min', tone: 'lavender' },
  { title: 'Behavioural interview', detail: 'Experiences, teamwork, and decisions', icon: MessageSquareText, time: '15–20 min', tone: 'peach' },
  { title: 'Mixed interview', detail: 'A balanced round for your target role', icon: BrainCircuit, time: '30 min', tone: 'mint' },
]

export default function InterviewLanding() {
  return (
    <div className="page-stack interview-landing">
      <section className="practice-hero">
        <div className="practice-hero-copy">
          <div className="practice-eyebrow"><span className="practice-eyebrow-icon"><Sparkles size={14} /></span> MOCK INTERVIEW STUDIO</div>
          <h1>Practise the interview.<br /><span>Understand every answer.</span></h1>
          <p>Build confidence with realistic questions, thoughtful follow-ups, and feedback that helps you see what to work on next.</p>
          <div className="practice-hero-actions">
            <Link to="/interview/setup" className="button button-primary"><Play size={15} fill="currentColor" /> Start a mock interview</Link>
            <a href="#how-it-works" className="practice-secondary-link">See how it works <ArrowRight size={15} /></a>
          </div>
          <div className="practice-trust-row"><span><CheckCircle2 size={14} /> Practise at your own pace</span><span><CheckCircle2 size={14} /> Review each answer</span></div>
        </div>
        <div className="practice-hero-visual" aria-label="Illustration of an interview question and progress summary">
          <div className="visual-orbit orbit-a" /><div className="visual-orbit orbit-b" />
          <div className="visual-question-card">
            <div className="visual-card-top"><span className="visual-live-dot" /> QUESTION 03 <span className="visual-question-type">TECHNICAL</span></div>
            <div className="visual-question-text">How would you improve the performance of a slow React page?</div>
            <div className="visual-answer-line line-long" /><div className="visual-answer-line line-mid" /><div className="visual-answer-line line-short" />
            <div className="visual-card-footer"><span><Clock3 size={13} /> 01:42 remaining</span><span className="visual-mic"><Mic2 size={15} /></span></div>
          </div>
          <div className="visual-feedback-card"><div className="visual-feedback-icon"><BarChart3 size={17} /></div><div><span>ANSWER STRUCTURE</span><strong>Good momentum</strong><div className="visual-feedback-bar"><i /></div></div><CheckCircle2 size={17} className="visual-feedback-check" /></div>
          <div className="visual-sparkle sparkle-one">✦</div><div className="visual-sparkle sparkle-two">✳</div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading-row"><div><p className="eyebrow">CHOOSE YOUR PRACTICE</p><h2>What would you like to work on?</h2><p className="page-subtitle">Start with one focused round. You can adjust the difficulty every time.</p></div><Link to="/interview/setup" className="text-link">Customise a session <ArrowRight size={14} /></Link></div>
        <div className="practice-format-grid">{formats.map(({ title, detail, icon: Icon, time, tone }) => <Link key={title} to="/interview/setup" className="practice-format-card"><div className={`format-icon ${tone}`}><Icon size={20} /></div><div className="format-time"><Clock3 size={12} /> {time}</div><h3>{title}</h3><p>{detail}</p><span className="format-card-link">Set up practice <ArrowRight size={14} /></span></Link>)}</div>
      </section>

      <section className="landing-section how-section" id="how-it-works">
        <div className="section-heading-row"><div><p className="eyebrow">A SIMPLE ROUTINE</p><h2>From practice to progress</h2><p className="page-subtitle">A repeatable way to prepare for your next interview.</p></div></div>
        <div className="how-steps">
          <div className="how-step"><span className="how-step-number">01</span><div className="how-step-icon"><Target size={18} /></div><h3>Choose your goal</h3><p>Set your target role, interview format, difficulty, and available time.</p></div>
          <div className="how-step"><span className="how-step-number">02</span><div className="how-step-icon"><Video size={18} /></div><h3>Answer in your own way</h3><p>Type your response now. Voice and camera workflows can be enabled in a later integration phase.</p></div>
          <div className="how-step"><span className="how-step-number">03</span><div className="how-step-icon"><AudioLines size={18} /></div><h3>Review and improve</h3><p>Reflect on structure, specific evidence, and the next skill to practise.</p></div>
        </div>
      </section>

      <section className="landing-bottom-cta"><div className="landing-cta-icon"><Sparkles size={19} /></div><div><h2>Make your next answer stronger.</h2><p>Start with a short practice round and build from there.</p></div><Link to="/interview/setup" className="button button-primary">Set up interview <ArrowRight size={15} /></Link></section>

      <section className="panel recent-panel landing-recent"><div className="panel-heading"><div><h3>Pick up where you left off</h3><p>Your recent practice sessions</p></div><Link to="/reports" className="text-link">View all reports <ArrowRight size={14} /></Link></div><div className="landing-session-list">{sessions.slice(0, 2).map((s) => <div className="landing-session-row" key={s.id}><div className="role-icon"><Code2 size={16} /></div><div className="landing-session-copy"><strong>{s.role}</strong><span>{s.type} · {s.date}</span></div><div className="landing-session-score"><strong>{s.score}</strong><span>/100</span></div><Link className="row-arrow" to={`/reports/${s.id}`} aria-label={`Open ${s.role} report`}><ArrowRight size={17} /></Link></div>)}</div></section>
      <p className="small-disclaimer">Research prototype: sample sessions and feedback shown here are illustrative. Real AI scoring, adaptive follow-ups, recording, and persistence will be connected in later phases.</p>
    </div>
  )
}
