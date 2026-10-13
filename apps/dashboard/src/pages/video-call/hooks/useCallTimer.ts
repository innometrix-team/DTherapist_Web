import { useEffect, useRef, useState } from "react";
import { Appointment } from "../../../api/Appointments.api";

function parseTimeToTimestamp(dateStr: string, timeStr: string): number | null {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return null;
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return Math.floor(
      new Date(year, month - 1, day, hours, minutes).getTime() / 1000
    );
  } catch {
    return null;
  }
}

export function useCallTimer(appointment?: Appointment, isJoined = false) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const sessionExpiredFiredRef = useRef(false);

  useEffect(() => {
    if (!appointment) return;
    const timeParts = appointment.time?.split(" - ");
    if (timeParts?.length === 2) {
      const end = parseTimeToTimestamp(appointment.date, timeParts[1]);
      if (end) {
        const rem = end - Math.floor(Date.now() / 1000);
        setRemainingTime(rem > 0 ? rem : 0);
        return;
      }
    }
    const expiresAt = appointment.action?.agoraToken?.expiresAt;
    if (expiresAt) {
      const rem = parseInt(expiresAt) - Math.floor(Date.now() / 1000);
      setRemainingTime(rem > 0 ? rem : 0);
    }
  }, [appointment]);

  useEffect(() => {
    if (remainingTime === null) return;

    if (remainingTime === 0 && !sessionExpiredFiredRef.current) {
      sessionExpiredFiredRef.current = true;
      if (isJoined) setSessionExpired(true);
      return;
    }

    if (remainingTime <= 0) return;

    timerIntervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        if (!prev || prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (!sessionExpiredFiredRef.current) {
            sessionExpiredFiredRef.current = true;
            setTimeout(() => setSessionExpired(true), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [remainingTime, isJoined]);

  const formattedTime = remainingTime !== null
    ? `${String(Math.floor(remainingTime / 60)).padStart(2, "0")}:${String(remainingTime % 60).padStart(2, "0")}`
    : "--:--";

  return {
    remainingTime,
    formattedTime,
    sessionExpired,
    setSessionExpired,
  };
}
