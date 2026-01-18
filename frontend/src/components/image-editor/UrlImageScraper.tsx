import { useState } from "react";
import { Button } from "@/components/ui/Button";
import LoadSpinner from "../ui/LoadSpinner";
import { scrapeUrl } from "../../api/scrape-api";
import { API_ENDPOINTS } from "../../api/api-endpoints";
import axios from "axios";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImagesLoaded: (files: File[]) => void;
}

function UrlImageScraper({ isOpen, onClose, onImagesLoaded }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      // Scrape the URL
      const data = await scrapeUrl(url);

      if (!data.image_urls || data.image_urls.length === 0) {
        setError("Inga bilder hittades på denna URL");
        setLoading(false);
        return;
      }

      setProgress({ current: 0, total: data.image_urls.length });

      // Download all images as File objects
      const files: File[] = [];
      for (let i = 0; i < data.image_urls.length; i++) {
        const imageUrl = data.image_urls[i];

        try {
          // Use backend proxy to download the image (bypasses CORS)
          const response = await axios.post(
            API_ENDPOINTS.scrape.downloadImage,
            { imageUrl },
            { responseType: "blob" }
          );

          if (response.status !== 200) {
            console.error(`Failed to fetch image ${i + 1}`);
            continue;
          }

          const blob = response.data;

          // Determine file extension
          const urlParts = imageUrl.split(".");
          const extension =
            urlParts[urlParts.length - 1].split("?")[0] || "webp";

          // Create a File object with a unique name
          const fileName = `scraped-${data.original_title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}-${i + 1}.${extension}`;
          const file = new File([blob], fileName, {
            type: blob.type || "image/webp",
          });

          files.push(file);
          setProgress({ current: i + 1, total: data.image_urls.length });
        } catch (err) {
          console.error(`Error downloading image ${i + 1}:`, err);
        }
      }

      if (files.length === 0) {
        setError("Couldn't download any images");
        setLoading(false);
        return;
      }

      // Pass the files to parent component
      onImagesLoaded(files);

      // Reset and close
      setUrl("");
      setLoading(false);
      setProgress(null);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while scraping";
      setError(errorMessage);
      setLoading(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUrl("");
      setError(null);
      setProgress(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Load images from URL
            </h2>
            {!loading && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Blocket URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.blocket.se/annons/..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-400">
                Paste the URL to a Blocket ad
              </p>
            </div>

            {progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Downloading images...</span>
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !url}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadSpinner size="sm" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Load images"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UrlImageScraper;
