import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";

import "./styles/index.css";
import App from "./App";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const container = document.getElementById("root") as HTMLElement;

const root = createRoot(container);
root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      signInFallbackRedirectUrl="/image-editor"
      signUpFallbackRedirectUrl="/image-editor">
      <App />
    </ClerkProvider>
  </StrictMode>
);
