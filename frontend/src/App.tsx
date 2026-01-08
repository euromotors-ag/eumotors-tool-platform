import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Home, Image, Data, Scrape, Converter } from "./pages";
import Layout from "./layout/Layout";
import { DebugLogProvider } from "./contexts/DebugLogContext";
import DebugTerminal from "./components/image-editor/DebugTerminal";
import { useDebugLog } from "./contexts/DebugLogContext";
import CustomSignIn from "./components/CustomSignIn";
import SSOCallback from "./components/SSOCallback";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
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

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/image-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Image />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Data />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scrape-editor"
          element={
            <ProtectedRoute>
              <Layout>
                <Scrape />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/converters"
          element={
            <ProtectedRoute>
              <Layout>
                <Converter />
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
