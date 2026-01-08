import { useState } from "react";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";

function CustomSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { isSignedIn } = useAuth();

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || !signUpLoaded) return;

    // Om användaren redan är inloggad, redirecta till startsidan
    if (isSignedIn) {
      window.location.href = "/";
      return;
    }

    setIsLoading(true);

    try {
      // Använd signIn för både nya och befintliga användare
      // Clerk hanterar automatiskt om användaren behöver registreras eller loggas in
      if (signIn) {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: window.location.origin + "/sso-callback",
          redirectUrlComplete: window.location.origin + "/",
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);

      // Om signIn misslyckas, försök med signUp för nya användare
      try {
        if (signUp) {
          await signUp.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: window.location.origin + "/sso-callback",
            redirectUrlComplete: window.location.origin + "/",
          });
        }
      } catch (signUpError) {
        console.error("Sign up error:", signUpError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Tools for EuroMotors AG
          </h2>

          <p className="text-sm text-muted-foreground">
            Organisation-based access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-lg shadow-xl border border-border p-8 relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Welcome back
            </h3>
            <p className="text-muted-foreground text-sm">
              Log In with your Google account
            </p>
          </div>

          {/* Custom Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full cursor-pointer flex items-center justify-center px-4 py-3 border border-border rounded-lg shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group relative overflow-hidden">
            {/* Gradient hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isLoading ? (
              <div className="flex items-center relative z-10">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3 relative z-10" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium relative z-10">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Security Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Secure login with organisation authentication
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Only users from EuroMotors AG can access this platform
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            EuroMotors AG @ {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomSignIn;
