import { useState } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: undefined,
    error: null,
    loading: false,
  });

  const requestLocation = () => {
    setLocationState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocationState((prev) => ({
        ...prev,
        loading: false,
        error: "Trình duyệt của bạn không hỗ trợ chia sẻ vị trí (Geolocation).",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Optional: Lấy địa chỉ cụ thể từ Nominatim API
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          if (d.display_name) address = d.display_name;
        } catch (e) {
          console.error("Không thể phân tích địa chỉ:", e);
        }

        setLocationState({
          latitude: lat,
          longitude: lng,
          address,
          error: null,
          loading: false,
        });

        // Gửi thông tin vị trí lên server API route đã cấu hình
        try {
          await fetch('/api/location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: lat,
              longitude: lng,
              address,
            }),
          });
        } catch (err) {
          console.error("Lỗi khi gửi vị trí lên server:", err);
        }
      },
      (error) => {
        let errorMessage = "Không thể lấy vị trí.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Người dùng từ chối cấp quyền chia sẻ vị trí.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Thông tin vị trí không khả dụng.";
            break;
          case error.TIMEOUT:
            errorMessage = "Yêu cầu lấy vị trí quá hạn.";
            break;
        }
        setLocationState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { ...locationState, requestLocation };
};
