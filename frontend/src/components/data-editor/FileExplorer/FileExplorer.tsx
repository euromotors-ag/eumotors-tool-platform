import { useState } from "react";
import { parseCarListing } from "../../../utils/parse";
import {
  CarListing,
  addSeatsEquipmentFromInteriorMaterial,
} from "../../../libs/catalog/index.mjs";
import { State } from "../../../hooks/useSubstate";
import { useToastContext } from "../../../hooks/useToast";
import "./FileExplorer.css";
import { DragDropFileUploader } from "./DragDropFileUploader";

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
  }
}

type ListingFileInfo = [string, FileSystemFileHandle];
type FolderInfo = [string, FileSystemDirectoryHandle];

export function FileExplorer({
  state,
}: {
  state: State<CarListing | undefined>;
}): React.ReactElement {
  const [rootDirHandle, setRootDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [currentDirHandle, setCurrentDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [listings, setListings] = useState<ListingFileInfo[]>([]);
  const [subfolders, setSubfolders] = useState<FolderInfo[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderInfo[]>([]);
  const [activeListing, setActiveListing] = useState<ListingFileInfo | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { success, error: errorToast } = useToastContext();

  const handleOpenFolder = async () => {
    try {
      setLoading(true);
      setError(null);
      const handle = await getDirectoryHandle();
      if (handle) {
        setRootDirHandle(handle);
        setCurrentDirHandle(handle);
        setBreadcrumbs([["root", handle]]);

        // Scan for subfolders and listing files
        const { folders, files } = await scanDirectory(handle);
        setSubfolders(folders);
        setListings(files);

        // If there's only one listing, open it automatically
        if (files.length === 1 && folders.length === 0) {
          await openListing(files[0]);
        }
      }
    } catch (err) {
      console.error("Error opening folder:", err);
      setError("Failed to open folder");
    } finally {
      setLoading(false);
    }
  };

  const openSubfolder = async (folderInfo: FolderInfo) => {
    try {
      setLoading(true);
      setError(null);

      // Update breadcrumbs
      const newBreadcrumbs = [...breadcrumbs, folderInfo];
      setBreadcrumbs(newBreadcrumbs);

      setCurrentDirHandle(folderInfo[1]);

      // Scan the subfolder
      const { folders, files } = await scanDirectory(folderInfo[1]);
      setSubfolders(folders);
      setListings(files);

      // If there's only one listing, open it automatically
      if (files.length === 1 && folders.length === 0) {
        await openListing(files[0]);
      }
    } catch (err) {
      console.error("Error opening subfolder:", err);
      setError("Failed to open subfolder");
    } finally {
      setLoading(false);
    }
  };

  const navigateToBreadcrumb = async (index: number) => {
    if (index >= 0 && index < breadcrumbs.length) {
      try {
        setLoading(true);
        setError(null);

        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);

        const folderInfo = newBreadcrumbs[index];
        setCurrentDirHandle(folderInfo[1]);

        // Scan the directory
        const { folders, files } = await scanDirectory(folderInfo[1]);
        setSubfolders(folders);
        setListings(files);

        // Clear active listing and reset parent state when navigating to a different folder
        if (
          files.length === 0 ||
          (activeListing && !files.some((file) => file[0] === activeListing[0]))
        ) {
          setActiveListing(null);
          state[1](undefined); // Reset the parent listing state
        }
      } catch (err) {
        console.error("Error navigating to breadcrumb:", err);
        setError("Failed to navigate to folder");
      } finally {
        setLoading(false);
      }
    }
  };

  const openListing = async (fileInfo: ListingFileInfo) => {
    try {
      setLoading(true);
      setError(null);

      // Load the new listing
      const listing = await loadListing(fileInfo);
      if (listing) {
        setActiveListing(fileInfo);
        state[1](listing); // Update the parent state
      } else {
        setError("Failed to load listing data");
      }
    } catch (err) {
      console.error("Error opening listing:", err);
      setError("Failed to open listing");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeListing || !state[0]) return;
    try {
      setLoading(true);
      await saveListing(activeListing, state[0]);
      setError(null); // Clear any previous errors
      success(`Listing saved successfully`);

      setTimeout(() => {
        setLoading(false);
        // Reset the active listing and parent state to return to the main view
        setActiveListing(null);
        state[1](undefined);

        // Reset navigation to root directory
        if (rootDirHandle) {
          setCurrentDirHandle(rootDirHandle);
          setBreadcrumbs([["root", rootDirHandle]]);

          // Re-scan the root directory to update the view
          scanDirectory(rootDirHandle)
            .then(({ folders, files }) => {
              setSubfolders(folders);
              setListings(files);
            })
            .catch((err) => {
              console.error("Error scanning root directory:", err);
            });
        }
      }, 1000);
    } catch (err) {
      console.error("Error saving listing:", err);
      setError("Failed to save listing");
      errorToast(`Failed to save listing`);
      setLoading(false);
    }
  };

  return (
    <div className="file-explorer">
      {error && (
        <div className="error-message bg-red-900/20 text-red-400 border border-red-800 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!rootDirHandle ? (
        <DragDropFileUploader
          onFolderSelect={handleOpenFolder}
          loading={loading}
        />
      ) : (
        <div className="file-explorer-content">
          <div className="file-explorer-buttons mb-4">
            <div className="flex flex-col space-y-4">
              <div className="save-info bg-gray-800/50 border-l-4 border-blue-500 p-3 rounded-lg mb-2 text-sm text-gray-300">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Changes are saved directly to the original file. No download
                    or manual file creation required.
                  </span>
                </div>
              </div>
              <div>
                <button
                  disabled={!activeListing || loading}
                  onClick={handleSave}
                  className="w-full cursor-pointer rounded-md bg-gray-800 hover:bg-gray-700 px-3 py-2.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving changes...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Save changes and return
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Breadcrumb navigation with integrated path display and active file indicator */}
          <div className="breadcrumbs bg-gray-800/70 border border-gray-700 rounded-md p-3 mb-5 overflow-x-auto">
            <div className="breadcrumbs-container flex flex-wrap items-center text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div
                  key={index}
                  className={`breadcrumb-item flex items-center min-w-0 flex-shrink-0 ${
                    index === breadcrumbs.length - 1 ? "active" : ""
                  }`}>
                  {index > 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mx-2 text-gray-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`flex items-center cursor-pointer hover:text-blue-400 truncate transition-colors rounded px-2 py-1 
                                            ${
                                              index === breadcrumbs.length - 1
                                                ? "bg-gray-700/70 text-white font-medium"
                                                : "text-gray-400 hover:bg-gray-700/50"
                                            }`}
                    title={index === 0 ? rootDirHandle?.name : crumb[0]}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 mr-1.5 flex-shrink-0 ${
                        index === breadcrumbs.length - 1
                          ? "text-blue-400"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      {index === 0 ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      )}
                    </svg>
                    <span className="truncate max-w-[150px] md:max-w-[200px] lg:max-w-[250px]">
                      {index === 0 ? rootDirHandle?.name : crumb[0]}
                    </span>
                  </button>
                </div>
              ))}

              {/* Path copy button */}
              <div className="ml-auto pl-3">
                <button
                  className="text-gray-400 cursor-pointer hover:text-blue-400 p-1 rounded transition-colors"
                  onClick={() => {
                    const path = breadcrumbs
                      .map((crumb, i) =>
                        i === 0 ? rootDirHandle?.name : crumb[0]
                      )
                      .join("/");
                    navigator.clipboard.writeText(path);
                  }}
                  title="Copy path">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Active file indicator */}
            <div className="mt-3 px-1 border-t border-gray-700 pt-3 active-file-indicator">
              <div
                className={`flex items-center text-xs ${
                  activeListing ? "has-file" : "no-file"
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 mr-1.5 ${
                    activeListing ? "text-blue-400" : "text-gray-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>
                  Active file:{" "}
                  {activeListing ? (
                    <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                      {activeListing[0]}/listing.json
                    </span>
                  ) : (
                    <span className="font-mono opacity-60">
                      No file selected
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="breadcrumb-hint flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Click on any folder above to navigate back</span>
              </div>
              {breadcrumbs.length > 1 && (
                <button
                  onClick={() => navigateToBreadcrumb(0)}
                  className="text-xs cursor-pointer text-blue-400 hover:text-blue-300 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Return to root
                </button>
              )}
            </div>
          </div>

          {/* Display subfolders - always show this section */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Folders:</h4>
            {subfolders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {subfolders.map((folderInfo) => (
                  <div
                    key={folderInfo[0]}
                    onClick={() => openSubfolder(folderInfo)}
                    className="folder-item p-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    {folderInfo[0]}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">
                No folders found in this directory
              </p>
            )}
          </div>

          {/* Display listing files - always show this section */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Listings:
            </h4>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {listings.map((fileInfo) => (
                  <div
                    key={fileInfo[0]}
                    onClick={() => openListing(fileInfo)}
                    className={`relative rounded-md ${
                      activeListing && activeListing[0] === fileInfo[0]
                        ? "p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                        : "p-0"
                    }`}>
                    <div
                      className={`listing-item p-2 rounded-md bg-gray-800 w-full h-full cursor-pointer
                                            ${
                                              activeListing &&
                                              activeListing[0] === fileInfo[0]
                                                ? ""
                                                : "border border-gray-700 hover:border-gray-600"
                                            }`}>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {fileInfo[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">
                No listing files found in this directory
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

async function getDirectoryHandle(): Promise<
  FileSystemDirectoryHandle | undefined
> {
  try {
    const handle = await window.showDirectoryPicker();
    return handle;
  } catch (err) {
    console.error("Failed to get directory handle:", err);
    return undefined;
  }
}

async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<{ folders: FolderInfo[]; files: ListingFileInfo[] }> {
  const folders: FolderInfo[] = [];
  const files: ListingFileInfo[] = [];

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "directory") {
        // Add folder to the folders list
        folders.push([entry.name, entry as FileSystemDirectoryHandle]);
      } else if (entry.kind === "file" && entry.name === "listing.json") {
        // For listing.json files directly in the current directory
        files.push([dirHandle.name, entry as FileSystemFileHandle]);
      }
    }

    if (files.length === 0) {
      try {
        // Check if there's a listing.json file in this directory
        const listingFileHandle = await dirHandle.getFileHandle("listing.json");
        if (listingFileHandle) {
          files.push([dirHandle.name, listingFileHandle]);
        }
      } catch {
        // No listing.json in this directory, that's okay
      }
    }

    return { folders, files };
  } catch (err) {
    console.error("Failed to scan directory:", err);
    return { folders: [], files: [] };
  }
}

async function loadListing(
  fileInfo: ListingFileInfo
): Promise<CarListing | undefined> {
  try {
    const file = await fileInfo[1].getFile();
    const text = await file.text();

    const json = JSON.parse(text);
    const listing = parseCarListing(json);

    // Ensure required fields exist with default values
    const listingWithDefaults = {
      ...listing,
      trim: listing?.trim ?? "",
      unique: listing?.unique ?? "",
      dealer_phone: listing?.dealer_phone ?? "",
      dealer_email: listing?.dealer_email ?? "",
    } as CarListing;

    return listingWithDefaults;
  } catch (err) {
    console.error(`Failed to load listing from ${fileInfo[0]}:`, err);
    return undefined;
  }
}

async function saveListing(
  fileInfo: ListingFileInfo,
  listing: CarListing
): Promise<void> {
  try {
    const updatedListing = {
      ...listing,
      data: {
        ...listing.data,
        equipment: addSeatsEquipmentFromInteriorMaterial(
          listing.data.equipment,
          listing.data.interior_material
        ),
      },
    };

    const writable = await fileInfo[1].createWritable();
    await writable.write(JSON.stringify(updatedListing, null, 2));
    await writable.close();
  } catch (err) {
    console.error(`Failed to save listing to ${fileInfo[0]}:`, err);
    throw err;
  }
}
