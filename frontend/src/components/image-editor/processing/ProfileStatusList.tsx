import { useState } from "react";
import { ProfileStatus } from "../types/processing";

interface Props {
  profileStatuses: ProfileStatus[];
  onRemoveProfile?: (profile: string) => void;
  getJobDataForProfile: (
    profile: string
  ) => { files: File[]; visualOrder: number[] } | null;
}

const ProfileStatusList: React.FC<Props> = ({
  profileStatuses,
  onRemoveProfile,
  getJobDataForProfile,
}) => {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(
    new Set()
  );

  // Visa bara om det finns jobb i kö:n
  if (profileStatuses.length === 0) {
    return null;
  }

  const toggleProfileExpansion = (profile: string) => {
    setExpandedProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(profile)) {
        newSet.delete(profile);
      } else {
        newSet.add(profile);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: ProfileStatus["status"]) => {
    switch (status) {
      case "ready":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400">Ready to process</span>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-yellow-400">Processing...</span>
          </div>
        );
      case "finished":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-400">Finished</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-red-400">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getProfileDisplayName = (profile: string) => {
    switch (profile.toLowerCase()) {
      case "eumotors":
        return "Euro Motors";
      case "cartrade24":
        return "Car Trade 24";
      case "white":
        return "White Background";
      case "removebg":
        return "Remove BG";
      case "all":
        return "All Profiles";
      case "download":
        return "Download Original";
      default:
        return profile;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-300">Processing Queue</h4>
        <span className="text-xs text-gray-400 font-medium">Status</span>
      </div>

      <div className="space-y-3">
        {profileStatuses.map((status, index) => {
          const isExpanded = expandedProfiles.has(status.profile);

          return (
            <div
              key={`${status.profile}-${index}`}
              className="bg-gray-700/30 rounded-lg border border-gray-600/30 overflow-hidden cursor-pointer hover:bg-gray-700/40 transition-colors duration-200"
              onClick={() => toggleProfileExpansion(status.profile)}>
              {/* Huvudrad - Delete knapp, profil info och expanderbar pil */}
              <div className="flex items-center justify-between p-3">
                {/* Vänster sida - Delete knapp och profil info */}
                <div className="flex items-center space-x-3">
                  {/* Remove button för enskilda profiler */}
                  {onRemoveProfile && status.status !== "processing" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Förhindra att hela diven expanderas
                        onRemoveProfile(status.profile);
                      }}
                      className="px-1 py-1 cursor-pointer text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-500/50 rounded transition-all duration-200"
                      title={`Remove ${getProfileDisplayName(
                        status.profile
                      )} from queue`}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="flex-1">
                    <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-2 items-center">
                      <span className="text-sm font-semibold text-white text-right min-w-[1.5rem]">
                        {status.count}
                      </span>
                      <span className="text-sm font-semibold text-gray-500 min-w-[3rem]">
                        image{status.count > 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-semibold text-gray-500 min-w-[1.5rem]">
                        for
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {getProfileDisplayName(status.profile)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Höger sida - Status och expanderbar pil */}
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}

                  {/* Expanderbar pil - nu bara visuell indikator */}
                  <div className="p-1 text-gray-400 transition-colors duration-200">
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
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
                  </div>
                </div>
              </div>

              {/* Expanderbar sektion med miniatyrer */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-600/30">
                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-xs text-gray-500 font-medium">
                      {getJobDataForProfile(status.profile)
                        ? `${
                            getJobDataForProfile(status.profile)!.files.length
                          } image${
                            getJobDataForProfile(status.profile)!.files.length >
                            1
                              ? "s"
                              : ""
                          } selected for this process`
                        : "No images currently selected for this process"}
                    </span>
                  </div>

                  {/* Visa miniatyrer om det finns valda bilder */}
                  {getJobDataForProfile(status.profile) &&
                    getJobDataForProfile(status.profile)!.files.length > 0 && (
                      <div className="flex space-x-2 mt-3 flex-wrap gap-2">
                        {getJobDataForProfile(status.profile)!.files.map(
                          (file, fileIndex) => {
                            // Använd visualOrder för att få rätt visuell index
                            const visualIndex = getJobDataForProfile(
                              status.profile
                            )!.visualOrder[fileIndex];

                            return (
                              <div
                                key={`${status.profile}-${fileIndex}`}
                                className="w-12 h-12 rounded border border-gray-600 overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0 relative"
                                title={`Image ${visualIndex + 1}`}>
                                {/* Lägg till index-nummer på miniatyren */}
                                <div className="absolute top-0 left-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-br z-10">
                                  {visualIndex + 1}
                                </div>
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Selected image ${visualIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          }
                        )}
                        {getJobDataForProfile(status.profile) &&
                          getJobDataForProfile(status.profile)!.files.length >
                            8 && (
                            <div className="w-12 h-12 rounded border border-gray-600 bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-400">
                                +
                                {getJobDataForProfile(status.profile)!.files
                                  .length - 8}
                              </span>
                            </div>
                          )}
                      </div>
                    )}

                  {/* Visa meddelande om inga bilder är valda för denna profil */}
                  {(!getJobDataForProfile(status.profile) ||
                    getJobDataForProfile(status.profile)!.files.length ===
                      0) && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        No images currently selected for this process
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-600/30">
        <p className="text-xs text-gray-500">
          Total:{" "}
          {profileStatuses.reduce((sum, status) => sum + status.count, 0)} image
          {profileStatuses.reduce((sum, status) => sum + status.count, 0) > 1
            ? "s"
            : ""}{" "}
          and {profileStatuses.length} process
          {profileStatuses.length > 1 ? "es" : ""}
        </p>
      </div>
    </div>
  );
};

export default ProfileStatusList;
