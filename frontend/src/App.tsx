import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { lazy, Suspense, useEffect } from "react";
import Layout from "./layout/Layout";
import { DebugLogProvider } from "./contexts/DebugLogContext";
import DebugTerminal from "./components/image-editor/DebugTerminal";
import { useDebugLog } from "./contexts/DebugLogContext";
import CustomSignIn from "./components/CustomSignIn";
import SSOCallback from "./components/SSOCallback";
import LoadSpinner from "./components/ui/LoadSpinner";
import { setAuthTokenGetter } from "./api/auth-token";

const Image = lazy(() => import("./pages/Image"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <PageLoader />;
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
  const { isSignedIn, getToken } = useAuth();

  // Backend requests send the Clerk session token
  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<CustomSignIn />} />
        <Route path="/sso-callback" element={<SSOCallback />} />

        {/* Image Editor is the only tool */}
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

        <Route path="*" element={<Navigate to="/image-editor" replace />} />
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
