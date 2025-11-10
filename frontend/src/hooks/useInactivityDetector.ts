import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { INACTIVITY_TIMEOUT } from "../utils/constants";

export function useInactivityDetector() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  // Använd useCallback för att memoize resetTimer funktionen
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      // Vid timeout, logga ut användaren
      sessionStorage.removeItem("isAuthenticated");
      localStorage.removeItem("auth_token");
      navigate("/login", {
        state: {
          message: "You have been logged out due to inactivity",
        },
      });
    }, INACTIVITY_TIMEOUT);
  }, [navigate]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
}
