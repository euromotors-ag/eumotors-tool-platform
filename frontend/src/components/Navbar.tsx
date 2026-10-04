import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { LogOutIcon } from "lucide-react";
import companyLogo from "@/assets/company_logo.svg";
import { Button } from "@/components/ui/Button";

function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const email = user?.emailAddresses[0]?.emailAddress;
  const userName = user?.fullName || user?.firstName || email || "User";
  const userInitial = (user?.firstName || email || "U").charAt(0).toUpperCase();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="relative z-50 border-b border-border bg-background">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/image-editor" className="flex items-center">
          <img
            src={companyLogo}
            className="h-10 w-auto brightness-0 dark:brightness-100"
            alt="EuroMotors AG"
          />
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-medium text-white"
            aria-hidden="true">
            {userInitial}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium leading-none">{userName}</span>
            {email && (
              <span className="mt-1 text-xs leading-none text-muted-foreground">
                {email}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOutIcon />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
