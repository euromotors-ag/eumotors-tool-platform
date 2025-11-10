import { createContext } from "react";
import { type ToastContextType } from "../types/types";

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
