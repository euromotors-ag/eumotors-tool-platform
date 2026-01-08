function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-t border-border pt-8 md:flex md:items-center md:justify-between">
          {/* Social icons */}
          <div className="flex justify-center md:justify-start space-x-6 md:order-2 w-full md:w-auto">
            <a
              href="https://github.com/euromotors-ag"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">GitHub</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            <a
              href="https://discord.gg/DFBtgj4AFq"
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Discord</span>
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" />
              </svg>
            </a>
          </div>

          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-muted-foreground">
              &copy; {currentYear} All rights reserved. Internal tools for
              EuroMotors AG.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Tools
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="/image-editor"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  Image Editor
                </a>
              </li>
              <li>
                <a
                  href="/data-editor"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  Data Editor
                </a>
              </li>
              <li>
                <a
                  href="/scrape-editor"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  Scraping
                </a>
              </li>
              <li>
                <a
                  href="https://ai.eumotors.ch/cars"
                  target="_blank"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  AutoScout Generator
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="https://discord.gg/DFBtgj4AFq"
                  target="_blank"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/euromotors-ag/"
                  target="_blank"
                  className="text-base text-gray-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </footer>
  );
}

export default Footer;
