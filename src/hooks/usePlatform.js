import { useEffect, useState } from 'react';

const IOS_SAFE_TOP_FALLBACK = 47;
const IOS_SAFE_BOTTOM_FALLBACK = 34;
const SAFE_AREA_TOP_MAX = 80;
const SAFE_AREA_BOTTOM_MAX = 60;
const SAFE_AREA_HORIZONTAL_MAX = 40;

function parseSafeAreaValue(cssVarName, fallbackValue = 0) {
  const computedStyle = getComputedStyle(document.documentElement);
  const rawValue = computedStyle.getPropertyValue(cssVarName).trim();
  const parsed = Number.parseFloat(rawValue.replace('px', ''));
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function detectPlatform() {
  const capacitorObject = window.Capacitor;
  const nativeFromCapacitorApi = capacitorObject?.isNativePlatform?.() === true;
  const nativeFromProtocol = document.URL.startsWith('capacitor://') || document.URL.startsWith('ionic://');
  const nativeFromGlobal = !!(capacitorObject && capacitorObject.platform && capacitorObject.platform !== 'web');
  const isCapacitor = nativeFromCapacitorApi || nativeFromProtocol || nativeFromGlobal;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const isNative = isCapacitor || (isIOS && isStandalone);

  const safeTopFallback = isIOS && isNative ? IOS_SAFE_TOP_FALLBACK : 0;
  const safeBottomFallback = isIOS && isNative ? IOS_SAFE_BOTTOM_FALLBACK : 0;
  const safeSideFallback = 0;

  const safeAreaTop = clamp(parseSafeAreaValue('--sat', safeTopFallback), 0, SAFE_AREA_TOP_MAX);
  const safeAreaBottom = clamp(parseSafeAreaValue('--sab', safeBottomFallback), 0, SAFE_AREA_BOTTOM_MAX);
  const safeAreaLeft = clamp(parseSafeAreaValue('--sal', safeSideFallback), 0, SAFE_AREA_HORIZONTAL_MAX);
  const safeAreaRight = clamp(parseSafeAreaValue('--sar', safeSideFallback), 0, SAFE_AREA_HORIZONTAL_MAX);

  return {
    isIOS,
    isCapacitor,
    isNative,
    isWeb: !isNative,
    safeAreaTop,
    safeAreaBottom,
    safeAreaLeft,
    safeAreaRight
  };
}

export function usePlatform() {
  const [platform, setPlatform] = useState({
    isIOS: false,
    isCapacitor: false,
    isNative: false,
    isWeb: true,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0
  });

  useEffect(() => {
    const updatePlatform = () => {
      const detected = detectPlatform();
      setPlatform(detected);

      document.body.classList.toggle('native-app', detected.isNative);
      document.body.classList.toggle('ios-app', detected.isNative && detected.isIOS);
    };

    updatePlatform();

    window.addEventListener('resize', updatePlatform, { passive: true });
    window.addEventListener('orientationchange', updatePlatform, { passive: true });
    window.visualViewport?.addEventListener('resize', updatePlatform);

    return () => {
      window.removeEventListener('resize', updatePlatform);
      window.removeEventListener('orientationchange', updatePlatform);
      window.visualViewport?.removeEventListener('resize', updatePlatform);
      document.body.classList.remove('native-app', 'ios-app');
    };
  }, []);

  return platform;
}

export default usePlatform;
