import { Dispatch, SetStateAction, memo } from "react";

export type ProfileType =
  | "eumotors"
  | "cartrade24"
  | "all"
  | "removebg"
  | "download";

interface Props {
  selectedProfile: ProfileType;
  setSelectedProfile: Dispatch<SetStateAction<ProfileType>>;
}

const ProfileSelector = memo(function ProfileSelector({
  selectedProfile,
  setSelectedProfile,
}: Props) {
  return (
    <div>
      <h3 className="mb-2 text-xl font-medium">Select Style</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Euro Motors Option */}
        <div
          className={`relative rounded-md ${
            selectedProfile === "eumotors"
              ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              : "p-0"
          }`}>
          <label
            className={`flex cursor-pointer items-center rounded-md p-2 sm:p-3 bg-gray-800 w-full h-full
              ${
                selectedProfile !== "eumotors"
                  ? "border border-gray-700 hover:border-gray-600"
                  : ""
              }`}>
            <input
              type="radio"
              value="eumotors"
              checked={selectedProfile === "eumotors"}
              onChange={() => setSelectedProfile("eumotors")}
              className="sr-only"
            />
            <div className="ml-2">
              <span className="block font-medium text-white text-sm sm:text-base">
                Euro Motors
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                Standard Overlay
              </span>
            </div>
          </label>
        </div>

        {/* Car Trade 24 Option */}
        <div
          className={`relative rounded-md ${
            selectedProfile === "cartrade24"
              ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              : "p-0"
          }`}>
          <label
            className={`flex cursor-pointer items-center rounded-md p-2 sm:p-3 bg-gray-800 w-full h-full
              ${
                selectedProfile !== "cartrade24"
                  ? "border border-gray-700 hover:border-gray-600"
                  : ""
              }`}>
            <input
              type="radio"
              value="cartrade24"
              checked={selectedProfile === "cartrade24"}
              onChange={() => setSelectedProfile("cartrade24")}
              className="sr-only"
            />
            <div className="ml-2">
              <span className="block font-medium text-white text-sm sm:text-base">
                Car Trade 24
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                Standard Overlay
              </span>
            </div>
          </label>
        </div>

        {/* All Option */}
        <div
          className={`relative rounded-md ${
            selectedProfile === "all"
              ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              : "p-0"
          }`}>
          <label
            className={`flex cursor-pointer items-center rounded-md p-2 sm:p-3 bg-gray-800 w-full h-full
              ${
                selectedProfile !== "all"
                  ? "border border-gray-700 hover:border-gray-600"
                  : ""
              }`}>
            <input
              type="radio"
              value="all"
              checked={selectedProfile === "all"}
              onChange={() => setSelectedProfile("all")}
              className="sr-only"
            />
            <div className="ml-2">
              <span className="block font-medium text-white text-sm sm:text-base">
                Both
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                All overlays at once
              </span>
            </div>
          </label>
        </div>

        {/* Remove Background Option */}
        <div
          className={`relative rounded-md ${
            selectedProfile === "removebg"
              ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              : "p-0"
          }`}>
          <label
            className={`flex cursor-pointer items-center rounded-md p-2 sm:p-3 bg-gray-800 w-full h-full
              ${
                selectedProfile !== "removebg"
                  ? "border border-gray-700 hover:border-gray-600"
                  : ""
              }`}>
            <input
              type="radio"
              value="removebg"
              checked={selectedProfile === "removebg"}
              onChange={() => setSelectedProfile("removebg")}
              className="sr-only"
            />
            <div className="ml-2">
              <span className="block font-medium text-white text-sm sm:text-base">
                BG Removal
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                Interior img only
              </span>
            </div>
          </label>
        </div>

        {/* Download Original Option */}
        <div
          className={`relative rounded-md ${
            selectedProfile === "download"
              ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              : "p-0"
          }`}>
          <label
            className={`flex cursor-pointer items-center rounded-md p-2 sm:p-3 bg-gray-800 w-full h-full
              ${
                selectedProfile !== "download"
                  ? "border border-gray-700 hover:border-gray-600"
                  : ""
              }`}>
            <input
              type="radio"
              value="download"
              checked={selectedProfile === "download"}
              onChange={() => setSelectedProfile("download")}
              className="sr-only"
            />
            <div className="flex h-8 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-900/30 text-teal-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div className="ml-2">
              <span className="block font-medium text-center sm:text-left text-white text-sm sm:text-base">
                Download Original
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                No processing
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
});

export default ProfileSelector;
