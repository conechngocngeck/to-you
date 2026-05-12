"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./BottleScene.module.css";

type SceneState = "idle" | "requesting" | "flowing" | "arrived" | "opening" | "open" | "denied";

// Path bottle travels: from left entry → through main river → down branch 2
const BOTTLE_PATH = "M -30,308 C 80,306 170,292 255,278 C 335,265 395,262 452,268 C 492,273 522,282 548,294 C 588,312 628,368 665,428 C 695,476 728,528 762,572";

const LETTER_CONTENT = `Gửi người đang đọc thư này,

Nếu bạn nhìn thấy những dòng chữ này,
điều đó có nghĩa là lá thư đã tìm được đến tay bạn.

Dòng sông cuộc đời đưa chúng ta đến những nơi
ta chưa từng nghĩ tới. Và đôi khi,
chính những khoảnh khắc ngẫu nhiên ấy
lại trở thành những ký ức đẹp nhất.

Hãy trân trọng từng khoảnh khắc bạn đang sống.
Hãy yêu thương những người xung quanh bạn.
Và đừng quên rằng, ở đâu đó trên thế giới này,
có người đang gửi đến bạn những điều tốt đẹp nhất.

Với tất cả yêu thương,
Người gửi lá thư 🌿`;

function getPointOnPath(pathData: string, t: number) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", pathData);
  const total = el.getTotalLength();
  const len = t * total;
  const pt = el.getPointAtLength(len);
  const p1 = el.getPointAtLength(Math.max(0, len - 3));
  const p2 = el.getPointAtLength(Math.min(total, len + 3));
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  return { x: pt.x, y: pt.y, angle };
}

export default function BottleScene() {
  const [sceneState, setSceneState] = useState<SceneState>("idle");
  const [bottle, setBottle] = useState({ x: -30, y: 308, angle: 0 });
  const [corkVisible, setCorkVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const DURATION = 5000;

  const animateBottle = useCallback(() => {
    if (!startTimeRef.current) startTimeRef.current = performance.now();
    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / DURATION, 1);
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - (-2 * progress + 2) ** 3 / 2;

    const pt = getPointOnPath(BOTTLE_PATH, eased);
    setBottle(pt);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animateBottle);
    } else {
      setSceneState("arrived");
      setTimeout(() => {
        setSceneState("opening");
        setCorkVisible(false);
        setTimeout(() => setSceneState("open"), 1200);
      }, 500);
    }
  }, []);

  const saveLocation = async (lat: number, lng: number) => {
    setSaveStatus("saving");
    try {
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        if (d.display_name) address = d.display_name;
      } catch { /* ignore */ }
      setLocationData({ lat, lng, address });
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, address, content: `📍 ${address} | ${lat.toFixed(6)}, ${lng.toFixed(6)}` }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
  };

  const handleGetLocation = () => {
    setSceneState("requesting");
    if (!navigator.geolocation) { setSceneState("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation(pos.coords.latitude, pos.coords.longitude);
        setSceneState("flowing");
        startTimeRef.current = null;
        rafRef.current = requestAnimationFrame(animateBottle);
      },
      () => setSceneState("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const isFlowing = sceneState === "flowing" || sceneState === "arrived" || sceneState === "opening";

  return (
    <div className={styles.container}>
      {/* ── SVG SCENE ── */}
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={styles.sceneSvg} aria-hidden="true">
        <defs>
          {/* Stripe pattern for fields */}
          <pattern id="stripe1" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,255,255,0.45)" strokeWidth="4"/>
          </pattern>
          <pattern id="stripe2" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(255,255,255,0.35)" strokeWidth="3"/>
          </pattern>
          {/* River dash pattern */}
          <pattern id="riverDash" width="30" height="1" patternUnits="userSpaceOnUse">
            <rect width="14" height="1" fill="rgba(255,255,255,0.55)"/>
          </pattern>
        </defs>

        {/* ── BACKGROUND ── */}
        <rect width="800" height="600" fill="#f4edd8"/>

        {/* ══ FIELDS (top area, above river) ══ */}
        {/* top-left cluster */}
        <rect x="0" y="0" width="115" height="100" rx="14" fill="#8fba72"/>
        <rect x="0" y="0" width="115" height="100" rx="14" fill="url(#stripe1)" opacity="0.7"/>
        <rect x="125" y="0" width="145" height="80" rx="16" fill="#c8e6a0"/>
        <rect x="280" y="0" width="155" height="90" rx="14" fill="#e8d870"/>
        <rect x="445" y="0" width="165" height="78" rx="16" fill="#8fba72"/>
        <rect x="620" y="0" width="180" height="95" rx="14" fill="#a8d691"/>
        <rect x="620" y="0" width="180" height="95" rx="14" fill="url(#stripe2)" opacity="0.5"/>

        {/* second row top */}
        <rect x="0" y="108" width="90" height="95" rx="12" fill="#e8d870"/>
        <rect x="125" y="88" width="140" height="100" rx="16" fill="#6fa860"/>
        <rect x="275" y="98" width="120" height="85" rx="14" fill="#c8e6a0"/>
        <rect x="620" y="102" width="180" height="95" rx="14" fill="#f0e080"/>
        <rect x="620" y="102" width="180" height="95" rx="14" fill="url(#stripe1)" opacity="0.4"/>

        {/* ── LAKE / POND (upper left) ── */}
        <ellipse cx="128" cy="185" rx="72" ry="48" fill="#a8d8e2"/>
        <ellipse cx="128" cy="185" rx="72" ry="48" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="8,10"/>

        {/* mid-left patch */}
        <rect x="0" y="210" width="95" height="90" rx="12" fill="#c8e6a0"/>

        {/* ══ FIELDS (between branches, right side) ══ */}
        <rect x="570" y="190" width="145" height="105" rx="14" fill="#c8e6a0"/>
        <rect x="570" y="190" width="145" height="105" rx="14" fill="url(#stripe2)" opacity="0.4"/>
        <rect x="660" y="180" width="140" height="100" rx="12" fill="#e8d870"/>

        {/* ══ FIELDS (below river) ══ */}
        <rect x="0" y="400" width="185" height="200" rx="18" fill="#e8d870"/>
        <rect x="0" y="400" width="185" height="200" rx="18" fill="url(#stripe2)" opacity="0.45"/>
        <rect x="195" y="440" width="165" height="160" rx="16" fill="#a8d691"/>
        <rect x="370" y="460" width="190" height="140" rx="16" fill="#8fba72"/>
        <rect x="370" y="460" width="190" height="140" rx="16" fill="url(#stripe1)" opacity="0.5"/>
        <rect x="695" y="400" width="105" height="200" rx="14" fill="#f0e080"/>

        {/* ══ RIVER SYSTEM ══ */}
        {/* Main river stem (thick) */}
        <path d="M 0,308 C 100,306 175,292 255,278 C 335,265 395,262 452,268 C 495,273 525,285 550,297"
          stroke="#7ecac8" strokeWidth="46" fill="none" strokeLinecap="round"/>

        {/* Branch A – upper right (decorative) */}
        <path d="M 550,297 C 600,278 665,248 740,228 C 768,220 790,216 820,212"
          stroke="#7ecac8" strokeWidth="34" fill="none" strokeLinecap="round"/>

        {/* Branch B – lower right (bottle destination) */}
        <path d="M 550,297 C 592,316 634,368 668,428 C 698,478 730,528 762,572"
          stroke="#7ecac8" strokeWidth="36" fill="none" strokeLinecap="round"/>

        {/* Branch C – small left downward branch */}
        <path d="M 255,278 C 248,330 238,385 228,435"
          stroke="#7ecac8" strokeWidth="24" fill="none" strokeLinecap="round"/>

        {/* River ripples – main stem */}
        <path d="M 0,308 C 100,306 175,292 255,278 C 335,265 395,262 452,268 C 495,273 525,285 550,297"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="none" strokeDasharray="10,18" strokeLinecap="round"/>
        {/* River ripples – branch B */}
        <path d="M 550,297 C 592,316 634,368 668,428 C 698,478 730,528 762,572"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="10,16" strokeLinecap="round"/>
        {/* River ripples – branch A */}
        <path d="M 550,297 C 600,278 665,248 740,228 C 768,220 790,216 820,212"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="10,16" strokeLinecap="round"/>

        {/* ══ TREES ══ */}
        {/* Helper: tree = dark circle (trunk shadow) + green circle */}
        {([
          [62,58],[92,52],[45,195],[82,210],[170,55],[155,65],
          [350,45],[375,38],[490,38],[510,50],
          [670,48],[700,40],[720,55],[750,42],
          [580,220],[610,210],[640,230],
          [42,360],[68,350],[100,375],
          [310,480],[330,465],[355,485],
          [440,415],[465,405],[490,420],
          [600,445],[630,430],[655,450],
          [220,390],[240,378],
        ] as [number,number][]).map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y + 3} r="13" fill="rgba(0,0,0,0.08)"/>
            <circle cx={x} cy={y} r="13" fill="#4d8c42"/>
            <circle cx={x - 4} cy={y - 4} r="6" fill="#6fa860"/>
          </g>
        ))}

        {/* ══ HOUSES ══ */}
        {([
          [160, 108], [182, 120],
          [52, 320], [68, 330],
          [420, 360], [440, 350],
          [710, 460], [726, 472],
        ] as [number,number][]).map(([x, y], i) => (
          <g key={i}>
            {/* shadow */}
            <rect x={x - 9} y={y - 4} width="20" height="18" rx="2" fill="rgba(0,0,0,0.1)"/>
            {/* body */}
            <rect x={x - 10} y={y - 5} width="20" height="18" rx="2" fill="#e8794a"/>
            {/* roof */}
            <polygon points={`${x - 12},${y - 5} ${x + 12},${y - 5} ${x},${y - 16}`} fill="#c45530"/>
            {/* window */}
            <rect x={x - 3} y={y} width="6" height="6" rx="1" fill="#fdf0d0"/>
          </g>
        ))}

        {/* ══ BOTTLE (animated) ══ */}
        <g transform={`translate(${bottle.x}, ${bottle.y}) rotate(${bottle.angle})`}>
          {/* shadow */}
          <ellipse cx="2" cy="6" rx="12" ry="5" fill="rgba(0,0,0,0.12)"/>
          {/* body */}
          <rect x="-11" y="-8" width="22" height="36" rx="9" fill="#5bbfc4" opacity="0.88"/>
          {/* neck */}
          <rect x="-6" y="-20" width="12" height="14" rx="4" fill="#5bbfc4" opacity="0.88"/>
          {/* liquid tint */}
          <rect x="-9" y="4" width="18" height="20" rx="6" fill="#3da5aa" opacity="0.5"/>
          {/* letter inside */}
          <rect x="-6" y="5" width="12" height="14" rx="2" fill="#fdf6e3" opacity="0.85"/>
          <line x1="-3" y1="9" x2="3" y2="9" stroke="#c8a882" strokeWidth="1.2"/>
          <line x1="-3" y1="12" x2="3" y2="12" stroke="#c8a882" strokeWidth="1.2"/>
          <line x1="-3" y1="15" x2="1" y2="15" stroke="#c8a882" strokeWidth="1.2"/>
          {/* shine */}
          <rect x="-8" y="-5" width="3" height="22" rx="1.5" fill="white" opacity="0.25"/>
          {/* cork */}
          {corkVisible && (
            <rect x="-5" y="-26" width="10" height="8" rx="2.5" fill="#c8956c"/>
          )}
          {/* cork popping animation */}
          {!corkVisible && (
            <g className={styles.corkPop}>
              <rect x="-5" y="-26" width="10" height="8" rx="2.5" fill="#c8956c"/>
            </g>
          )}
        </g>

        {/* ══ FORK INDICATOR (shown during flow) ══ */}
        {isFlowing && (
          <g>
            <circle cx="550" cy="297" r="10" fill="#f4a040" opacity="0.85">
              <animate attributeName="r" values="8;13;8" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.85;0.4;0.85" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          </g>
        )}
      </svg>

      {/* ── UI OVERLAY ── */}
      <div className={styles.overlay}>

        {/* IDLE state */}
        {sceneState === "idle" && (
          <div className={styles.titleCard}>
            <div className={styles.titleEmoji}>🍾</div>
            <h1 className={styles.title}>
              Chai thư đang trôi đến bạn<br/>
              <span className={styles.titleAccent}>trong 1 nghìn năm ánh sáng</span>
            </h1>
            <p className={styles.subtitle}>bạn chỉ cần 1 giây để mở lên</p>
            <div className={styles.ctaWrapper}>
              <button
                id="get-location-btn"
                className={styles.ctaBtn}
                onClick={handleGetLocation}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <span>📍</span> nhận chai thông điệp
              </button>
              <div className={`${styles.tooltip} ${showTooltip ? styles.tooltipVisible : ""}`}>
                từ người cute nhất zũ trụ 🌟
              </div>
            </div>
          </div>
        )}

        {/* REQUESTING */}
        {sceneState === "requesting" && (
          <div className={styles.statusPill}>
            <span className={styles.spinner}/>
            ôi, chai thư đã lạc đường mất rồi, bạn hãy chỉ dẫn nó nhé 🗺️
          </div>
        )}

        {/* FLOWING */}
        {sceneState === "flowing" && (
          <div className={styles.statusPill}>
            🌊 Chai đang trôi theo dòng sông...
          </div>
        )}

        {/* ARRIVED / OPENING */}
        {(sceneState === "arrived" || sceneState === "opening") && (
          <div className={styles.statusPill}>
            {sceneState === "arrived" ? "🍾 Chai đã đến!" : "✨ Đang mở lá thư..."}
          </div>
        )}

        {/* OPEN – letter */}
        {sceneState === "open" && (
          <div className={styles.letterOverlay}>
            <div className={styles.letterCard}>
              <div className={styles.letterWax}>🔴</div>
              <h2 className={styles.letterTitle}>✉️ Lá Thư Từ Dòng Sông</h2>
              <div className={styles.letterRule}/>
              <pre className={styles.letterContent}>{LETTER_CONTENT}</pre>
              {locationData && (
                <div className={styles.locationTag}>
                  <span>📍</span>
                  <span>
                    {saveStatus === "saving" && "Đang ghi nhận vị trí..."}
                    {saveStatus === "saved" && "Vị trí đã được ghi nhận ✓"}
                    {saveStatus === "error" && "Không thể lưu vị trí"}
                  </span>
                </div>
              )}
              <div className={styles.letterFoot}>🌿 Được gửi từ dòng sông thời gian</div>
            </div>
          </div>
        )}

        {/* DENIED */}
        {sceneState === "denied" && (
          <div className={styles.deniedCard}>
            <div className={styles.deniedIcon}>🔒</div>
            <p className={styles.deniedSub}>Chiếc chai vẫn đứng yên... Lá thư chưa thể đến tay bạn.</p>
            <button id="retry-btn" className={styles.retryBtn} onClick={() => window.location.reload()}>
              🔄 Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
