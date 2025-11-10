export interface Platform {
  id: string;
  name: string;
  url: string;
  description: string;
  status: "active" | "inactive" | "expired";
  login: string;
  password: string;
  plan: string;
  cost: string;
  nextBilling?: string;
  lastUsed?: string;
  usage?: string;
  storage?: string;
  icon: string;
}

export interface ToastContextType {
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number }) => void;
  warning: (message: string, options?: { duration?: number }) => void;
  info: (message: string, options?: { duration?: number }) => void;
  clearAll: () => void;
}
