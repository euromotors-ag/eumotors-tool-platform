import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleSignOut = () => {
    signOut();
  };

  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.emailAddresses[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.emailAddresses[0]?.emailAddress || "User";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-8 mr-2"
                src="/company_logo.svg"
                alt="Logo"
              />
              <span className="font-bold text-xl"> EuroMotors AG</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Start
              </Link>
              <Link
                to="/image-editor"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Image Editor
              </Link>
              <Link
                to="/data-editor"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Data Editor
              </Link>
              <Link
                to="/scrape-editor"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Scraping Images
              </Link>
              <Link
                to="https://auto-scout-linker-bilalovai.replit.app/cars"
                target="_blank"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                AutoScout Tool
              </Link>

              {/* User profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={toggleProfile}
                  className="flex items-center cursor-pointer space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitial()}
                  </div>
                  <span className="text-sm text-gray-300 hidden md:block">
                    {getUserName()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">
                        {getUserName()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-700 focus:outline-none"
              aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Start
          </Link>
          <Link
            to="/licenses"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Licenses
          </Link>
          <Link
            to="/image-editor"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Image Editor
          </Link>
          <Link
            to="/data-editor"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Data Editor
          </Link>
          <Link
            to="/data-editor"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Scrape Editor
          </Link>
          <Link
            to="https://auto-scout-linker-bilalovai.replit.app/cars"
            target="_blank"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            AutoScout Generator
          </Link>
          <Link
            to="/templates"
            className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(false)}>
            Templates
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
