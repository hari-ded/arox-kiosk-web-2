export function isLegacyTabletMode() {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('kioskMode');
    if (forced === 'legacy') return true;
    if (forced === 'modern') return false;

    const ua = window.navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const hasTouch = (window.navigator.maxTouchPoints || 0) > 1 || 'ontouchstart' in window;
    const minDim = Math.min(window.screen.width || 0, window.screen.height || 0);
    const tabletHint = /(Tablet|Tab|SM-T|Lenovo TB|Lenovo TB-|Nexus 7|Nexus 10|Silk|KF[A-Z]+|Android(?!.*Mobile))/i.test(ua);

    return isAndroid && hasTouch && (tabletHint || (minDim >= 600 && minDim <= 1600));
  } catch {
    return false;
  }
}

export function applyKioskModeAttribute() {
  if (typeof document === 'undefined') return 'modern';

  const mode = isLegacyTabletMode() ? 'legacy' : 'modern';
  document.documentElement.setAttribute('data-kiosk-mode', mode);
  return mode;
}
