function Footer() {
  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} All rights reserved. Internal tools
          for EuroMotors AG.
        </p>
      </div>

      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </footer>
  );
}

export default Footer;
