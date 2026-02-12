import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';

export function useNativeFeatures() {
  const [isNative, setIsNative] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    const checkDarkMode = () => {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(dark);
      if (native) {
        StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
      }
    };

    checkDarkMode();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    if (native) {
      SplashScreen.hide().catch(() => {});
      
      Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
      }).catch(() => {});
      
      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      }).catch(() => {});
    }

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  const haptic = useCallback(async (type = 'light') => {
    if (!isNative) return;
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (e) {
      // Haptic not available
    }
  }, [isNative]);

  const setStatusBar = useCallback(async (dark = false) => {
    if (!isNative) return;
    try {
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    } catch (e) {
      // StatusBar not available
    }
  }, [isNative]);

  const hideKeyboard = useCallback(async () => {
    if (!isNative) return;
    try {
      await Keyboard.hide();
    } catch (e) {
      // Keyboard hide not available
    }
  }, [isNative]);

  return {
    isNative,
    isDarkMode,
    keyboardHeight,
    haptic,
    setStatusBar,
    hideKeyboard
  };
}

export default useNativeFeatures;
