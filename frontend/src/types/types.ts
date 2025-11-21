export interface ToastContextType {
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number }) => void;
  warning: (message: string, options?: { duration?: number }) => void;
  info: (message: string, options?: { duration?: number }) => void;
  clearAll: () => void;
}
