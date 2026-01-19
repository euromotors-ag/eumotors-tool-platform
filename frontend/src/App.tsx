import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { lazy, Suspense } from "react";
import Layout from "./layout/Layout";
import { DebugLogProvider } from "./contexts/DebugLogContext";
import DebugTerminal from "./components/image-editor/DebugTerminal";
import { useDebugLog } from "./contexts/DebugLogContext";
import CustomSignIn from "./components/CustomSignIn";
import SSOCallback from "./components/SSOCallback";
import LoadSpinner from "./components/ui/LoadSpinner";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home").then(module => ({ default: module.default })));
const Image = lazy(() => import("./pages/Image").then(module => ({ default: module.default })));
const Scrape = lazy(() => import("./pages/Scrape").then(module => ({ default: module.default })));
const Converter = lazy(() => import("./pages/Converter").then(module => ({ default: module.default })));
const JsonEditor = lazy(() => import("./pages/JsonEditor").then(module => ({ default: module.JsonEditor })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <LoadSpinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <LoadSpinner />
    </div>
  );
}

function AppContent() {
  const { logs, clearLogs, isExpanded, toggleExpanded } = useDebugLog();
  const { isSignedIn } = useAuth();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<CustomSignIn />} />
        <Route path="/sso-callback" element={<SSOCallback />} />

        {/* Protected Routes - Lazy loaded with Suspense */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Home />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/image-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Image />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scrape-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Scrape />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/converters"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Converter />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/json-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <JsonEditor />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback for other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Debug Terminal - only show when signed in */}
      {isSignedIn && (
        <DebugTerminal
          logs={logs}
          onClearLogs={clearLogs}
          isExpanded={isExpanded}
          onToggleExpanded={toggleExpanded}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <DebugLogProvider>
        <AppContent />
      </DebugLogProvider>
    </BrowserRouter>
  );
}

export default App;
