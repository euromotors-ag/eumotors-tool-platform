import { useEffect } from "react";
import { useAuth, useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

function SSOCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const navigate = useNavigate();

  useEffect(() => {
    // Vänta tills alla komponenter är laddade
    if (!isLoaded || !signInLoaded || !signUpLoaded) {
      return;
    }

    // Om användaren redan är inloggad, omdirigera till startsidan
    if (isSignedIn) {
      navigate("/", { replace: true });
      return;
    }

    // Hantera signIn status
    if (signIn && signIn.status === "complete") {
      navigate("/", { replace: true });
      return;
    }

    // Hantera signUp status
    if (signUp && signUp.status === "complete") {
      navigate("/", { replace: true });
      return;
    }

    // Om något gick fel, omdirigera tillbaka till inloggningssidan
    if (signIn?.status === "needs_identifier") {
      navigate("/sign-in", { replace: true });
      return;
    }

    if (signUp?.status === "missing_requirements") {
      navigate("/sign-in", { replace: true });
      return;
    }

    // Om autentiseringen behöver ytterligare faktorer, stanna på callback-sidan
    // för att låta Clerk hantera det
  }, [
    isSignedIn,
    isLoaded,
    signInLoaded,
    signUpLoaded,
    signIn,
    signUp,
    navigate,
  ]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}

export default SSOCallback;
