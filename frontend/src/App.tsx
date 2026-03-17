import { useEffect, useRef, useState, useCallback } from 'react';

interface PupilPosition {
  x: number;
  y: number;
}

// SVG coordinate system: viewBox="0 0 400 400"
// Face center: (200, 200), radius: 160
// Left eye center: (145, 175), Right eye center: (255, 175)
const FACE_CX = 200;
const FACE_CY = 200;
const FACE_R = 160;

const LEFT_EYE = { cx: 145, cy: 175, r: 28 };
const RIGHT_EYE = { cx: 255, cy: 175, r: 28 };
const PUPIL_R = 11;
const PUPIL_MAX_OFFSET = 13;

function computePupilPos(
  eyeCx: number,
  eyeCy: number,
  svgRect: DOMRect | null,
  mouseX: number,
  mouseY: number
): PupilPosition {
  if (!svgRect) return { x: eyeCx, y: eyeCy };

  // Convert mouse to SVG coordinate space (viewBox 0 0 400 400)
  const scaleX = 400 / svgRect.width;
  const scaleY = 400 / svgRect.height;
  const svgMouseX = (mouseX - svgRect.left) * scaleX;
  const svgMouseY = (mouseY - svgRect.top) * scaleY;

  const dx = svgMouseX - eyeCx;
  const dy = svgMouseY - eyeCy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { x: eyeCx, y: eyeCy };

  const offset = Math.min(dist, PUPIL_MAX_OFFSET);
  return {
    x: eyeCx + (dx / dist) * offset,
    y: eyeCy + (dy / dist) * offset,
  };
}

// Eyelash definitions for each eye
// Each lash: { angle (degrees from top), length }
const LASH_DEFS = [
  { angle: -40, length: 22 },
  { angle: -20, length: 28 },
  { angle: 0,   length: 30 },
  { angle: 20,  length: 28 },
  { angle: 40,  length: 22 },
];

function Eyelashes({
  cx,
  cy,
  eyeR,
  blinkProgress, // 0 = open, 1 = fully closed
}: {
  cx: number;
  cy: number;
  eyeR: number;
  blinkProgress: number;
}) {
  return (
    <g>
      {LASH_DEFS.map((lash, i) => {
        const baseAngleDeg = -90 + lash.angle;
        const blinkRotation = 180 * blinkProgress;
        const angleDeg = baseAngleDeg + blinkRotation;
        const angleRad = (angleDeg * Math.PI) / 180;

        const startX = cx + eyeR * Math.cos(angleRad);
        const startY = cy + eyeR * Math.sin(angleRad);

        const endX = cx + (eyeR + lash.length) * Math.cos(angleRad);
        const endY = cy + (eyeR + lash.length) * Math.sin(angleRad);

        return (
          <line
            key={i}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#1a0a00"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function Eye({
  cx,
  cy,
  eyeR,
  pupilPos,
  blinkProgress,
}: {
  cx: number;
  cy: number;
  eyeR: number;
  pupilPos: PupilPosition;
  blinkProgress: number;
}) {
  const clipId = `eye-clip-${cx}`;
  const lidHeight = eyeR * 2 * blinkProgress;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={eyeR} />
        </clipPath>
      </defs>

      {/* Eye white */}
      <circle cx={cx} cy={cy} r={eyeR} fill="#fffef0" />

      {/* Pupil */}
      <circle
        cx={pupilPos.x}
        cy={pupilPos.y}
        r={PUPIL_R}
        fill="#1a0a00"
        clipPath={`url(#${clipId})`}
      />

      {/* Pupil shine */}
      <circle
        cx={pupilPos.x - 3}
        cy={pupilPos.y - 3}
        r={3.5}
        fill="white"
        opacity={0.85}
        clipPath={`url(#${clipId})`}
      />

      {/* Eye outline */}
      <circle cx={cx} cy={cy} r={eyeR} fill="none" stroke="#1a0a00" strokeWidth={2.5} />

      {/* Eyelid overlay (closes from top) */}
      {blinkProgress > 0 && (
        <rect
          x={cx - eyeR}
          y={cy - eyeR}
          width={eyeR * 2}
          height={lidHeight}
          fill="#f5c842"
          clipPath={`url(#${clipId})`}
        />
      )}

      {/* Eyelashes */}
      <Eyelashes cx={cx} cy={cy} eyeR={eyeR} blinkProgress={blinkProgress} />
    </g>
  );
}

type MouthState = 'smile' | 'open' | 'bitten';

function Mouth({ onBite }: { onBite: () => void }) {
  // Not used here — state is managed in App and passed down
  return null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void Mouth;

function MouthSVG({
  mouthState,
  onMouseEnter,
}: {
  mouthState: MouthState;
  onMouseEnter: () => void;
}) {
  return (
    <g>
      {/* Mouth interior (visible when open) */}
      {mouthState === 'open' && (
        <>
          {/* Dark mouth interior */}
          <ellipse cx={200} cy={278} rx={38} ry={22} fill="#2a0800" />
          {/* Teeth top row */}
          <rect x={168} y={258} width={18} height={12} rx={3} fill="#fffef0" />
          <rect x={191} y={258} width={18} height={12} rx={3} fill="#fffef0" />
          <rect x={214} y={258} width={18} height={12} rx={3} fill="#fffef0" />
          {/* Teeth bottom row */}
          <rect x={175} y={282} width={16} height={10} rx={3} fill="#fffef0" />
          <rect x={196} y={282} width={16} height={10} rx={3} fill="#fffef0" />
          <rect x={217} y={282} width={14} height={10} rx={3} fill="#fffef0" />
          {/* Tongue */}
          <ellipse cx={200} cy={294} rx={20} ry={10} fill="#e05050" />
        </>
      )}

      {/* Smile path — shown in 'smile' state */}
      {mouthState === 'smile' && (
        <path
          d="M 140 255 Q 200 315 260 255"
          fill="none"
          stroke="#1a0a00"
          strokeWidth={5}
          strokeLinecap="round"
        />
      )}

      {/* Open mouth outline */}
      {mouthState === 'open' && (
        <ellipse
          cx={200}
          cy={278}
          rx={38}
          ry={22}
          fill="none"
          stroke="#1a0a00"
          strokeWidth={3}
        />
      )}

      {/* Bitten / closed mouth — slight flat line with a subtle smirk */}
      {mouthState === 'bitten' && (
        <>
          {/* Flat closed line */}
          <path
            d="M 155 268 Q 200 272 245 268"
            fill="none"
            stroke="#1a0a00"
            strokeWidth={5}
            strokeLinecap="round"
          />
          {/* Small dimples at corners */}
          <circle cx={155} cy={268} r={3} fill="#c49010" opacity={0.5} />
          <circle cx={245} cy={268} r={3} fill="#c49010" opacity={0.5} />
        </>
      )}

      {/* Invisible hit area — large ellipse over the mouth region */}
      <ellipse
        cx={200}
        cy={275}
        rx={70}
        ry={35}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onMouseEnter={onMouseEnter}
      />
    </g>
  );
}

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null);
  const svgRectRef = useRef<DOMRect | null>(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animFrameRef = useRef<number>(0);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBitingRef = useRef(false);

  const [leftPupil, setLeftPupil] = useState<PupilPosition>({ x: LEFT_EYE.cx, y: LEFT_EYE.cy });
  const [rightPupil, setRightPupil] = useState<PupilPosition>({ x: RIGHT_EYE.cx, y: RIGHT_EYE.cy });
  const [blinkProgress, setBlinkProgress] = useState(0);
  const [mouthState, setMouthState] = useState<MouthState>('smile');

  // Update SVG rect on resize
  const updateRect = useCallback(() => {
    if (svgRef.current) {
      svgRectRef.current = svgRef.current.getBoundingClientRect();
    }
  }, []);

  // Mouse tracking with rAF
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateRect);
    updateRect();

    const tick = () => {
      const rect = svgRectRef.current;
      const { x: mx, y: my } = mouseRef.current;

      setLeftPupil(computePupilPos(LEFT_EYE.cx, LEFT_EYE.cy, rect, mx, my));
      setRightPupil(computePupilPos(RIGHT_EYE.cx, RIGHT_EYE.cy, rect, mx, my));

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateRect);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateRect]);

  // Blinking logic
  const scheduleBlink = useCallback(() => {
    const delay = 3000 + Math.random() * 4000; // 3–7 seconds
    blinkTimeoutRef.current = setTimeout(() => {
      const CLOSE_DURATION = 100;
      const OPEN_DURATION = 130;
      const HOLD_DURATION = 60;
      const startClose = performance.now();

      const animateClose = (now: number) => {
        const t = Math.min((now - startClose) / CLOSE_DURATION, 1);
        setBlinkProgress(t);
        if (t < 1) {
          requestAnimationFrame(animateClose);
        } else {
          setTimeout(() => {
            const startOpen = performance.now();
            const animateOpen = (now2: number) => {
              const t2 = Math.min((now2 - startOpen) / OPEN_DURATION, 1);
              setBlinkProgress(1 - t2);
              if (t2 < 1) {
                requestAnimationFrame(animateOpen);
              } else {
                setBlinkProgress(0);
                scheduleBlink();
              }
            };
            requestAnimationFrame(animateOpen);
          }, HOLD_DURATION);
        }
      };

      requestAnimationFrame(animateClose);
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBlink();
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [scheduleBlink]);

  // Mouth bite handler
  const handleMouthEnter = useCallback(() => {
    // Prevent re-triggering while already mid-bite
    if (isBitingRef.current) return;
    isBitingRef.current = true;

    // Open the mouth
    setMouthState('open');

    // After 180ms, snap to bitten/closed
    biteTimeoutRef.current = setTimeout(() => {
      setMouthState('bitten');
      // Allow re-triggering after the animation settles
      setTimeout(() => {
        isBitingRef.current = false;
      }, 100);
    }, 180);
  }, []);

  useEffect(() => {
    return () => {
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      <main className="face-stage">
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className="smiley-svg"
          aria-label="Interactive smiley face"
        >
          {/* Glow filter */}
          <defs>
            <radialGradient id="faceGrad" cx="42%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#ffe566" />
              <stop offset="60%" stopColor="#f5c842" />
              <stop offset="100%" stopColor="#d4a017" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient glow behind face */}
          <circle
            cx={FACE_CX}
            cy={FACE_CY}
            r={FACE_R + 20}
            fill="#f5c842"
            opacity={0.08}
            filter="url(#softGlow)"
          />

          {/* Face body */}
          <circle
            cx={FACE_CX}
            cy={FACE_CY}
            r={FACE_R}
            fill="url(#faceGrad)"
            stroke="#c49010"
            strokeWidth={3}
          />

          {/* Cheek blush left */}
          <ellipse cx={120} cy={248} rx={28} ry={16} fill="#f0a030" opacity={0.25} />
          {/* Cheek blush right */}
          <ellipse cx={280} cy={248} rx={28} ry={16} fill="#f0a030" opacity={0.25} />

          {/* Left Eye */}
          <Eye
            cx={LEFT_EYE.cx}
            cy={LEFT_EYE.cy}
            eyeR={LEFT_EYE.r}
            pupilPos={leftPupil}
            blinkProgress={blinkProgress}
          />

          {/* Right Eye */}
          <Eye
            cx={RIGHT_EYE.cx}
            cy={RIGHT_EYE.cy}
            eyeR={RIGHT_EYE.r}
            pupilPos={rightPupil}
            blinkProgress={blinkProgress}
          />

          {/* Nose (subtle) */}
          <ellipse cx={200} cy={218} rx={8} ry={5} fill="#c49010" opacity={0.4} />

          {/* Interactive Mouth */}
          <MouthSVG mouthState={mouthState} onMouseEnter={handleMouthEnter} />
        </svg>
      </main>

      <footer className="app-footer">
        <span>
          Built with{' '}
          <span className="heart" aria-label="love">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'smiley-face')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            caffeine.ai
          </a>
        </span>
        <span className="footer-year">© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
