import { Button } from "../components/ui/Button";

function Home() {
  type UpdateType = "bugfix" | "enhance" | "feature" | "infrastructure";
  type PriorityType = "high" | "medium" | "low";
  type StatusType = "investigating" | "planned" | "in-progress" | "fixed";

  type Update = {
    date: string;
    title: string;
    description: string;
    type: UpdateType;
  };

  type Issue = {
    id: string;
    title: string;
    description: string;
    priority: PriorityType;
    status: StatusType;
  };

  const updates: Update[] = [
    {
      date: "May 12, 2025",
      title: "Data Editor & System Improvements",
      description:
        "Fixed 'Remove all images' button in Image Editor, extended session token to 24 hours, increased login attempts to 5, and updated Data Editor equipment dictionary.",
      type: "enhance",
    },
    {
      date: "May 1, 2025",
      title: "Data Editor Integration",
      description:
        "Successfully integrated Data Editor into the platform, allowing for more efficient vehicle data management.",
      type: "feature",
    },
    {
      date: "May 1, 2025",
      title: "Data Editor Integration",
      description:
        "Successfully integrated Data Editor into the platform, allowing for more efficient vehicle data management.",
      type: "feature",
    },
    {
      date: "April 26, 2025",
      title: "Image Editor Enhancement",
      description:
        "Improved performance and stability for CarTrade24 profiles.",
      type: "enhance",
    },
    {
      date: "April 24, 2025",
      title: "Backend Infrastructure",
      description:
        "Migrated backend to Render for better stability and performance.",
      type: "infrastructure",
    },
    {
      date: "April 20, 2025",
      title: "Bug Fix: Processing Indicator",
      description:
        "Fixed an issue where the processing indicator would sometimes remain visible after completion.",
      type: "bugfix",
    },
  ];

  const knownIssues: Issue[] = [
    {
      id: "issue-3",
      title: "Server Timeout on Large Files",
      description:
        "Images larger than 8MB may cause timeout errors during processing.",
      priority: "high",
      status: "in-progress",
    },
    {
      id: "issue-7",
      title: "Adding 'coming soon' logo Profile to image editor",
      description:
        "Be able to choose images with a 'coming soon' logo for the image editor.",
      priority: "high",
      status: "in-progress",
    },
    {
      id: "issue-8",
      title: "Can't delete the last character in Data Editor",
      description:
        "The input field in the Data Editor doesn't allow deletion of the last character, need to be refreshed.",
      priority: "high",
      status: "in-progress",
    },
    {
      id: "issue-4",
      title: "Single Image Processing Limitation",
      description:
        "Currently only one image can be processed at a time. Batch processing of multiple images simultaneously is under development.",
      priority: "high",
      status: "investigating",
    },
    {
      id: "issue-6",
      title: "Scraping Integration",
      description:
        "The Scraping tool currently lacks import/export functionality. CSV and JSON file handling before integration is needed.",
      priority: "medium",
      status: "planned",
    },
    {
      id: "issue-2",
      title: "Mobile View Layout Issues",
      description:
        "Image previews may appear distorted on mobile devices in landscape orientation.",
      priority: "low",
      status: "planned",
    },
  ];

  const getUpdateTypeStyles = (type: UpdateType): string => {
    switch (type) {
      case "bugfix":
        return "bg-red-900/20 text-red-400 border-red-800";
      case "enhance":
        return "bg-green-900/20 text-green-400 border-green-800";
      case "feature":
        return "bg-blue-900/20 text-blue-400 border-blue-800";
      case "infrastructure":
        return "bg-purple-900/20 text-purple-400 border-purple-800";
      default:
        return "bg-gray-800/50 text-gray-400 border-gray-700";
    }
  };

  const getPriorityStyles = (priority: PriorityType): string => {
    switch (priority) {
      case "high":
        return "bg-red-900/20 text-red-400 border-red-800";
      case "medium":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-800";
      case "low":
        return "bg-blue-900/20 text-blue-400 border-blue-800";
      default:
        return "bg-gray-800/50 text-gray-400 border-gray-700";
    }
  };

  const getStatusStyles = (status: StatusType): string => {
    switch (status) {
      case "investigating":
        return "bg-purple-900/20 text-purple-400";
      case "planned":
        return "bg-blue-900/20 text-blue-400";
      case "in-progress":
        return "bg-green-900/20 text-green-400";
      case "fixed":
        return "bg-gray-800/50 text-gray-400 line-through";
      default:
        return "bg-gray-800/50 text-gray-400";
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen py-8">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="secondary" size="default" className=" sm:w-auto">
            <span className="hidden sm:inline">Settings</span>
            <svg
              className="w-5 h-5 sm:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Button>
        </div>

        {/* Existing Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <a
            href="/image-editor"
            className="block bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Image Editor</h2>
            <p className="text-gray-400 text-sm">
              AI-powered background removal and image processing.
            </p>
          </a>

          {/* Tool Card: Data Editor */}
          <a
            href="/data-editor"
            className="block bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Data Editor</h2>
            <p className="text-gray-400 text-sm">
              Manage and edit structured data efficiently.
            </p>
          </a>

          {/* Tool Card: Scraping */}
          <a
            href="/scrape-editor"
            className="block bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Scraping</h2>
            <p className="text-gray-400 text-sm">
              Extract data from websites with ease.
            </p>
          </a>
        </div>

        {/* Two-column layout for updates and known issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Updates</h2>
              <a
                href="#"
                className="text-sm text-blue-400 hover:text-blue-300 transition">
                View all updates →
              </a>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-5 border-b border-gray-700">
                <h3 className="text-lg font-medium">Change Log</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Latest improvements, bug fixes, and new features
                </p>
              </div>

              <div className="divide-y divide-gray-700">
                {updates.map((update, index) => (
                  <div key={index} className="p-5 hover:bg-gray-750">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{update.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">
                          {update.description}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUpdateTypeStyles(
                          update.type
                        )}`}>
                        {update.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {update.date}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-850 border-t border-gray-700">
                <button className="cursor-pointer w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition text-sm font-medium">
                  Show more
                </button>
              </div>
            </div>
          </div>

          {/* New Known Issues Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Known Issues</h2>
              <a
                href="#"
                className="text-sm text-blue-400 hover:text-blue-300 transition">
                Report new issue →
              </a>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-5 border-b border-gray-700">
                <h3 className="text-lg font-medium">Issues Being Addressed</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Problems we're aware of and working to resolve
                </p>
              </div>

              <div className="divide-y divide-gray-700">
                {knownIssues.map((issue) => (
                  <div key={issue.id} className="p-5 hover:bg-gray-750">
                    {/* Mobile: Stacked layout */}
                    <div className="block lg:hidden">
                      <h4 className="font-medium mb-2">{issue.title}</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyles(
                            issue.status
                          )}`}>
                          {issue.status}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyles(
                            issue.priority
                          )}`}>
                          {issue.priority}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {issue.description}
                      </p>
                    </div>

                    {/* Desktop: Original layout */}
                    <div className="hidden lg:block">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{issue.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyles(
                                issue.status
                              )}`}>
                              {issue.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {issue.description}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyles(
                            issue.priority
                          )}`}>
                          {issue.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-850 border-t border-gray-700">
                <button className="cursor-pointer w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition text-sm font-medium">
                  Show more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
