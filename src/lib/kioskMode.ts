export function isLegacyTabletMode() {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('kioskMode');
    if (forced === 'legacy') return true;
    if (forced === 'modern') return false;

    const ua = window.navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isLenovo = /Lenovo/i.test(ua);
    const isTab4Ten = /TB-X304|TB-X303|TB-X306|Lenovo Tab 4 10/i.test(ua);
    const hasTouch = (window.navigator.maxTouchPoints || 0) > 1 || 'ontouchstart' in window;
    const width = window.screen.width || 0;
    const height = window.screen.height || 0;
    const landscapeTablet = width >= 1024 && height >= 600 && Math.min(width, height) <= 900;
    const tabletLike = hasTouch && Math.max(width, height) >= 900 && Math.min(width, height) >= 600;

    return isAndroid && hasTouch && (isTab4Ten || (isLenovo && tabletLike) || landscapeTablet);
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
