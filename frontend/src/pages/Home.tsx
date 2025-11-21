import PageContainer from "@/components/PageContainer";

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
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
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

            <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-medium">Change Log</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Latest improvements, bug fixes, and new features
                </p>
              </div>

              <div className="divide-y divide-border">
                {updates.map((update, index) => (
                  <div key={index} className="p-5 hover:bg-accent/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{update.title}</h4>
                        <p className="text-muted-foreground text-sm mt-1">
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
                    <div className="text-xs text-muted-foreground/80 mt-2">
                      {update.date}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted/50 border-t border-border">
                <button className="cursor-pointer w-full py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition text-sm font-medium">
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

            <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-medium">Issues Being Addressed</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Problems we're aware of and working to resolve
                </p>
              </div>

              <div className="divide-y divide-border">
                {knownIssues.map((issue) => (
                  <div key={issue.id} className="p-5 hover:bg-accent/50">
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
                      <p className="text-muted-foreground text-sm">
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
                          <p className="text-muted-foreground text-sm mt-1">
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

              <div className="p-4 bg-muted/50 border-t border-border">
                <button className="cursor-pointer w-full py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition text-sm font-medium">
                  Show more
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default Home;
