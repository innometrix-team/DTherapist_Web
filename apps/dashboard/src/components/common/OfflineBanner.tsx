import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestored(true);
        timer = setTimeout(() => setShowRestored(false), 3500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-darkerb text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 border-b border-gray-700 transition-all z-50 sticky top-0"
      >
        <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>You are currently offline. Content will synchronize when your connection is restored.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-600 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 transition-all z-50 sticky top-0"
      >
        <Wifi className="w-4 h-4" />
        <span>Internet connection restored. You are back online.</span>
      </div>
    );
  }

  return null;
}

export default OfflineBanner;
