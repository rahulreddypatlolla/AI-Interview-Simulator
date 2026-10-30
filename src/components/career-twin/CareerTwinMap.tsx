import React from 'react'

interface CareerTwinMapProps {
  step: 1 | 2 | 3 | 4 | 5
  role?: string
  dailyTime?: string
  mission?: string
}

export const CareerTwinMap: React.FC<CareerTwinMapProps> = ({
  step,
  role = 'Software engineer',
}) => {
  const showSkills = step >= 2
  const showRoute = step === 4

  return (
    <div
      className="career-twin-canvas-wrap"
      style={{
        background: '#ffffff',
        border: '1px solid #e9ecf2',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 14px rgba(32, 43, 69, 0.04)',
      }}
    >
      <div
        className="career-twin-canvas-header"
        style={{
          background: '#f8f9fd',
          borderBottom: '1px solid #eaedf3',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          className="career-twin-title"
          style={{
            color: '#20283b',
            fontWeight: 750,
            fontSize: 14.5,
            fontFamily: 'Manrope, sans-serif',
          }}
        >
          Your Career Twin
        </span>
        {step >= 2 && (
          <div
            className="top-role-badge"
            style={{
              background: '#f0f1ff',
              border: '1px solid #e0e3fa',
              color: '#525fc2',
              padding: '3px 11px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{role}</span>
          </div>
        )}
      </div>

      <div className="career-twin-canvas" style={{ position: 'relative', width: '100%', background: '#f8f9fd' }}>
        <svg
          viewBox="0 0 760 520"
          className="career-twin-svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', display: 'block' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="twinGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(98, 111, 208, 0.08)" strokeWidth="1" />
            </pattern>

            {/* Route gradient */}
            <linearGradient id="routeGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#626fd0" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="#f8f9fd" />
          <rect width="100%" height="100%" fill="url(#twinGrid)" />

          {/* ================= ISLAND CONTOURS ================= */}

          {/* 1. CODE CRAFT (Bottom-Center-Left) */}
          <g className="island-group" id="code-craft-island">
            <path
              d="M 120 380 C 120 320, 200 300, 310 310 C 410 320, 480 340, 470 410 C 460 470, 360 490, 260 480 C 170 470, 120 440, 120 380 Z"
              fill="rgba(240, 242, 255, 0.7)"
              stroke="#cbd3ed"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <path
              d="M 155 385 C 155 340, 220 325, 305 335 C 385 345, 435 365, 425 415 C 415 455, 340 470, 265 460 C 195 450, 155 430, 155 385 Z"
              fill="rgba(227, 231, 252, 0.65)"
              stroke="#b8c2e6"
              strokeWidth="1.2"
            />
            <path
              d="M 200 395 C 200 365, 250 355, 300 360 C 350 365, 380 380, 375 410 C 370 435, 320 445, 275 440 C 230 435, 200 420, 200 395 Z"
              fill="rgba(215, 221, 248, 0.6)"
              stroke="#a6b3de"
              strokeWidth="1"
            />
            <text x="280" y="338" fill="#5460a8" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
              CODE CRAFT
            </text>
          </g>

          {/* 2. DELIVERY (Top Center) */}
          <g className="island-group" id="delivery-island">
            <path
              d="M 370 230 C 360 170, 420 140, 520 145 C 610 150, 670 190, 660 250 C 650 300, 570 320, 480 310 C 400 300, 375 270, 370 230 Z"
              fill="rgba(240, 242, 255, 0.7)"
              stroke="#cbd3ed"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <path
              d="M 405 235 C 395 190, 445 165, 525 170 C 595 175, 635 205, 625 250 C 615 285, 555 300, 485 290 C 425 280, 410 260, 405 235 Z"
              fill="rgba(227, 231, 252, 0.65)"
              stroke="#b8c2e6"
              strokeWidth="1.2"
            />
            <text x="520" y="166" fill="#5460a8" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
              DELIVERY
            </text>
          </g>

          {/* 3. SYSTEMS (Center Below Delivery) */}
          <g className="island-group" id="systems-island">
            <path
              d="M 450 380 C 445 335, 490 315, 560 320 C 625 325, 665 350, 660 390 C 655 425, 600 445, 540 440 C 475 435, 455 410, 450 380 Z"
              fill="rgba(240, 242, 255, 0.7)"
              stroke="#cbd3ed"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <path
              d="M 480 380 C 475 350, 510 335, 560 340 C 605 345, 635 365, 630 395 C 625 415, 585 430, 545 425 C 500 420, 485 400, 480 380 Z"
              fill="rgba(227, 231, 252, 0.65)"
              stroke="#b8c2e6"
              strokeWidth="1"
            />
            <text x="555" y="342" fill="#5460a8" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
              SYSTEMS
            </text>
          </g>

          {/* 4. PEOPLE (Right Center) */}
          <g className="island-group" id="people-island">
            <path
              d="M 585 270 C 580 225, 620 205, 680 210 C 735 215, 770 240, 765 280 C 760 315, 715 335, 660 330 C 610 325, 590 300, 585 270 Z"
              fill="rgba(240, 242, 255, 0.7)"
              stroke="#cbd3ed"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <path
              d="M 610 270 C 605 240, 635 225, 680 230 C 720 235, 745 255, 740 285 C 735 305, 700 320, 665 315 C 630 310, 615 295, 610 270 Z"
              fill="rgba(227, 231, 252, 0.65)"
              stroke="#b8c2e6"
              strokeWidth="1"
            />
            <text x="675" y="235" fill="#5460a8" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
              PEOPLE
            </text>
          </g>

          {/* 5. DATA AND CLOUD (Bottom Right) */}
          <g className="island-group" id="data-cloud-island">
            <path
              d="M 565 425 C 560 375, 610 355, 690 360 C 760 365, 800 395, 795 440 C 790 480, 730 500, 660 495 C 600 490, 570 460, 565 425 Z"
              fill="rgba(240, 242, 255, 0.7)"
              stroke="#cbd3ed"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <path
              d="M 595 425 C 590 390, 630 375, 690 380 C 745 385, 775 410, 770 445 C 765 470, 720 485, 670 480 C 625 475, 600 455, 595 425 Z"
              fill="rgba(227, 231, 252, 0.65)"
              stroke="#b8c2e6"
              strokeWidth="1"
            />
            <text x="680" y="365" fill="#5460a8" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
              DATA AND CLOUD
            </text>
          </g>

          {/* ================= STEP 4 ROUTE LINE ================= */}
          {showRoute && (
            <g className="route-layer">
              <path
                d="M 135 465 L 205 425 L 295 410 L 680 160"
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="3.2"
                filter="url(#mapGlow)"
              />
              <path
                d="M 135 465 L 205 425 L 295 410"
                fill="none"
                stroke="#626fd0"
                strokeWidth="3"
              />
              <path
                d="M 295 410 L 680 160"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Milestone Step 1 indicator on Algorithms */}
              <circle cx="295" cy="410" r="13" fill="#ffffff" stroke="#626fd0" strokeWidth="2.5" />
              <text x="295" y="414" fill="#626fd0" fontSize="10" fontWeight="800" textAnchor="middle">
                1
              </text>
            </g>
          )}

          {/* ================= SKILL NODES (Steps 2, 3, 4) ================= */}
          {showSkills && (
            <g className="skill-nodes">
              {/* Python */}
              <g transform="translate(150, 395)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">Python</text>
              </g>

              {/* Data Structures */}
              <g transform="translate(205, 425)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">Data structures</text>
              </g>

              {/* Algorithms */}
              <g transform="translate(295, 410)">
                <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="#626fd0" strokeWidth="2" />
                <circle cx="0" cy="0" r="3.5" fill="#626fd0" />
                <text x="0" y="-14" fill="#20283b" fontSize="11" fontWeight="750" textAnchor="middle">Algorithms</text>
              </g>

              {/* Java */}
              <g transform="translate(365, 435)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">Java</text>
              </g>

              {/* SQL */}
              <g transform="translate(425, 385)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">SQL</text>
              </g>

              {/* System Design (in Delivery) */}
              <g transform="translate(520, 245)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">System design</text>
              </g>

              {/* Communication (in People) */}
              <g transform="translate(685, 275)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">Communication</text>
              </g>

              {/* Git (in Data & Cloud) */}
              <g transform="translate(685, 435)">
                <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#626fd0" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#626fd0" />
                <text x="0" y="20" fill="#20283b" fontSize="10.5" fontWeight="600" textAnchor="middle">Git</text>
              </g>
            </g>
          )}

          {/* ================= USER NODE (Bottom-Left) ================= */}
          <g transform="translate(135, 465)">
            <circle cx="0" cy="0" r="16" fill="#f0f1ff" stroke="#626fd0" strokeWidth="2.5" />
            <circle cx="0" cy="-4" r="4.5" fill="none" stroke="#626fd0" strokeWidth="1.8" />
            <path d="M -8 8 C -8 3, 8 3, 8 8" fill="none" stroke="#626fd0" strokeWidth="1.8" />
          </g>

          {/* ================= TARGET / GOAL (Top-Right) ================= */}
          {step === 1 ? (
            <g transform="translate(650, 135)">
              <rect
                x="-55"
                y="-18"
                width="110"
                height="36"
                rx="18"
                fill="#ffffff"
                stroke="#cbd3ed"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />
              <text x="0" y="5" fill="#606b82" fontSize="10" fontWeight="600" textAnchor="middle">
                Your goal goes here
              </text>
            </g>
          ) : (
            <g transform="translate(680, 140)">
              {/* Flag pole */}
              <line x1="0" y1="0" x2="0" y2="40" stroke="#626fd0" strokeWidth="2.5" strokeLinecap="round" />
              {/* Flag pennant */}
              <path d="M 0 0 L -22 8 L 0 16 Z" fill="#626fd0" />
              {/* Flag badge */}
              <g transform="translate(-40, -15)">
                <text x="0" y="-12" fill="#20283b" fontSize="11" fontWeight="700" textAnchor="middle">
                  {role}
                </text>
                <rect x="-35" y="-6" width="70" height="20" rx="10" fill="#626fd0" />
                <text x="0" y="8" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                  {step === 4 ? '0 of 8 shown' : '8 skills'}
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Start Label & Legend at Bottom */}
        <div
          className="canvas-footer-info"
          style={{
            padding: '10px 18px',
            borderTop: '1px solid #eaedf3',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#606b82',
          }}
        >
          <span className="map-start-tag" style={{ fontWeight: 600 }}>Your map starts here.</span>
          {showSkills && (
            <span className="map-legend-tag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#626fd0',
                  display: 'inline-block',
                }}
              />
              Not shown yet · 8
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CareerTwinMap
