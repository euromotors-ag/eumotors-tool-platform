import { useState, useRef, useEffect } from "react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error" | "api";
  message: string;
  details?: unknown;
}

interface DebugTerminalProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const DebugTerminal = ({
  logs,
  onClearLogs,
  isExpanded,
  onToggleExpanded,
}: DebugTerminalProps) => {
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "ℹ️";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "api":
        return "🌐";
      default:
        return "📝";
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "text-blue-400";
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      case "api":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return (
      timestamp.toLocaleTimeString("sv-SE", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + `.${timestamp.getMilliseconds().toString().padStart(3, "0")}`
    );
  };

  const exportLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${formatTimestamp(log.timestamp)}] ${log.type.toUpperCase()}: ${
            log.message
          }${
            log.details
              ? `\nDetails: ${JSON.stringify(log.details, null, 2)}`
              : ""
          }`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleExpanded}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 flex items-center gap-2 transition-colors">
          <span className="text-sm">🐛</span>
          <span className="text-sm font-mono">Debug Console</span>
          {logs.length > 1 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {logs.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-80 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 rounded-t-lg flex items-center justify-between border-b border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-sm">🐛</span>
          <span className="text-sm font-mono text-white">Debug Console</span>
          {logs.length > 1 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`text-xs px-2 py-1 rounded ${
              isAutoScroll
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300"
            }`}>
            Auto
          </button>
          <button
            onClick={exportLogs}
            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500">
            Export
          </button>
          <button
            onClick={onClearLogs}
            className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500">
            Clear
          </button>
          <button
            onClick={onToggleExpanded}
            className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-500">
            ✕
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-black">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No logs yet. Start processing images to see debug information.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 flex-shrink-0">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                <span
                  className={`flex-shrink-0 font-semibold ${getLogColor(
                    log.type
                  )}`}>
                  {log.type.toUpperCase()}:
                </span>
                <span className="text-gray-300 break-words">{log.message}</span>
              </div>
              {log.details !== undefined && (
                <div className="ml-8 mt-1 text-gray-400 text-xs">
                  <pre className="whitespace-pre-wrap break-words">
                    {typeof log.details === "string"
                      ? (log.details as string)
                      : JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-3 py-1 rounded-b-lg border-t border-gray-600">
        <div className="text-xs text-gray-400 font-mono flex justify-between items-center">
          <span>
            {logs.length} log entries | Auto-scroll:{" "}
            {isAutoScroll ? "ON" : "OFF"}
          </span>
          {logs.length > 800 && (
            <span className="text-yellow-400 text-xs">
              ⚠️ {logs.length}/1000 logs
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugTerminal;
