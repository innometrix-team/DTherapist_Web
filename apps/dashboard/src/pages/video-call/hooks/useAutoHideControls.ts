import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Automatically hides video call overlay bars after a period of inactivity
 * and reveals them on pointer movement, touch, or bar hover.
 */
export function useAutoHideControls(enabled: boolean, delayMs = 3000) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);
  const isHoveringBarRef = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (!enabled || isHoveringBarRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, delayMs);
  }, [clearHideTimer, delayMs, enabled]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const onBarMouseEnter = useCallback(() => {
    isHoveringBarRef.current = true;
    clearHideTimer();
    setControlsVisible(true);
  }, [clearHideTimer]);

  const onBarMouseLeave = useCallback(() => {
    isHoveringBarRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (!enabled) {
      clearHideTimer();
      setControlsVisible(true);
      return;
    }

    showControls();
    return clearHideTimer;
  }, [clearHideTimer, enabled, showControls]);

  return {
    controlsVisible,
    showControls,
    onBarMouseEnter,
    onBarMouseLeave,
  };
}
