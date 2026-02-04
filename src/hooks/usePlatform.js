// Hook pour détecter la plateforme (iOS native vs Web)
import { useState, useEffect } from 'react';

export function usePlatform() {
  const [platform, setPlatform] = useState({
    isIOS: false,
    isCapacitor: false,
    isNative: false,
    isWeb: true,
    safeAreaTop: 0,
    safeAreaBottom: 0
  });

  useEffect(() => {
    // Détecter Capacitor
    const isCapacitor = typeof window !== 'undefined' && 
      (window.Capacitor !== undefined || 
       document.URL.startsWith('capacitor://') ||
       document.URL.startsWith('ionic://'));
    
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Détecter standalone mode (PWA installée)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    // Native = Capacitor ou PWA standalone sur iOS
    const isNative = isCapacitor || (isIOS && isStandalone);
    
    // Safe areas pour le notch
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTop = parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) || 
      (isIOS && isNative ? 47 : 0); // Fallback pour notch iPhone
    const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) ||
      (isIOS && isNative ? 34 : 0); // Fallback pour home indicator

    setPlatform({
      isIOS,
      isCapacitor,
      isNative,
      isWeb: !isNative,
      safeAreaTop,
      safeAreaBottom
    });

    // Ajouter des classes au body pour CSS conditionnel
    if (isNative) {
      document.body.classList.add('native-app');
      if (isIOS) document.body.classList.add('ios-app');
    }

    // Log pour debug
    console.log('Platform detected:', { isIOS, isCapacitor, isNative, isStandalone });
  }, []);

  return platform;
}

export default usePlatform;
