import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { LogEntry } from "../components/image-editor/DebugTerminal";

interface DebugLogContextType {
  logs: LogEntry[];
  addLog: (type: LogEntry["type"], message: string, details?: unknown) => void;
  clearLogs: () => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const DebugLogContext = createContext<DebugLogContextType | undefined>(
  undefined
);

export const useDebugLog = () => {
  const context = useContext(DebugLogContext);
  if (context === undefined) {
    throw new Error("useDebugLog must be used within a DebugLogProvider");
  }
  return context;
};

interface DebugLogProviderProps {
  children: ReactNode;
}

export const DebugLogProvider: React.FC<DebugLogProviderProps> = ({
  children,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Maximum number of logs to keep in memory
  const MAX_LOGS = 1000;

  const addLog = useCallback(
    (type: LogEntry["type"], message: string, details?: unknown) => {
      const newLog: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type,
        message,
        details,
      };

      setLogs((prev) => {
        const newLogs = [...prev, newLog];

        // Auto-trim logs if they exceed the maximum
        if (newLogs.length > MAX_LOGS) {
          // Keep the most recent logs and remove the oldest ones
          const trimmedLogs = newLogs.slice(-MAX_LOGS);

          // Add a warning log about the auto-trim
          const trimWarning: LogEntry = {
            id: `trim-${Date.now()}`,
            timestamp: new Date(),
            type: "warning",
            message: `Auto-trimmed ${
              newLogs.length - MAX_LOGS
            } old log entries (keeping latest ${MAX_LOGS})`,
            details: {
              reason: "Maximum log limit reached",
              maxLogs: MAX_LOGS,
              trimmedCount: newLogs.length - MAX_LOGS,
            },
          };

          return [...trimmedLogs, trimWarning];
        }

        return newLogs;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Auto-clear logs on page refresh/new session
  useEffect(() => {
    const sessionKey = "debug-logs-session";
    const currentSession = Date.now().toString();
    const lastSession = sessionStorage.getItem(sessionKey);

    if (lastSession && lastSession !== currentSession) {
      // New session detected, clear old logs
      setLogs([]);
      addLog("info", "New session started - previous logs cleared", {
        reason: "Session change detected",
        previousSession: lastSession,
        currentSession,
      });
    }

    sessionStorage.setItem(sessionKey, currentSession);
  }, [addLog]);

  const value: DebugLogContextType = {
    logs,
    addLog,
    clearLogs,
    isExpanded,
    toggleExpanded,
  };

  return (
    <DebugLogContext.Provider value={value}>
      {children}
    </DebugLogContext.Provider>
  );
};
