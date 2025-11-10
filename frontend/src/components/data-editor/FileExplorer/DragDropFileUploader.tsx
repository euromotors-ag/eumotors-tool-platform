import React, { useState } from "react";
import "./FileExplorer.css";

interface DragDropFileUploaderProps {
  onFolderSelect: () => Promise<void>;
  loading: boolean;
}

export function DragDropFileUploader({
  onFolderSelect,
  loading,
}: DragDropFileUploaderProps): React.ReactElement {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    await onFolderSelect();
  };

  return (
    <div
      className={`drag-drop-container relative w-full p-8 rounded-xl border-2 border-dashed ${
        isDragActive ? "border-blue-500 drag-drop-active" : "border-gray-600"
      } hover:border-blue-500 transition-colors duration-300 bg-gray-800/50 cursor-pointer group`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onFolderSelect}>
      {/* Animated gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Interactive elements */}
      <div className="relative flex flex-col items-center justify-center py-10 z-10">
        {loading ? (
          <div className="flex flex-col items-center">
            {/* Animated loading icon */}
            <div className="h-16 w-16 mb-4 relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
              <div
                className="absolute inset-1 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin"
                style={{ animationDuration: "1s" }}></div>
              <div
                className="absolute inset-2 rounded-full border-t-2 border-r-2 border-pink-500 animate-spin"
                style={{ animationDuration: "1.5s" }}></div>
            </div>
            <p className="text-gray-300 text-lg font-medium">
              Opening folder...
            </p>
          </div>
        ) : (
          <>
            {/* Upload Icon with Animated Glow */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-[1px] mb-6 relative">
              <div className="h-full w-full rounded-full bg-gray-800 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              Drop Folder Here
            </h3>
            <p className="text-gray-400 text-center mb-4 max-w-md">
              Drop a folder with car listings or click to browse
            </p>

            {/* Browse button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering with the container's click
                onFolderSelect();
              }}
              disabled={loading}
              className="cursor-pointer mt-2 py-2 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-500 hover:to-purple-500 transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:pointer-events-none">
              Browse Files
            </button>

            {/* Browser compatibility info */}
            {!("showDirectoryPicker" in window) && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Your browser doesn't support folder selection. Please use
                  Chrome, Edge, or Firefox for full functionality.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
