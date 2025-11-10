import React, { useState } from "react";
import { type ScrapeResponse } from "../../api/scrape-api";

interface ScrapedDataDisplayProps {
  data: ScrapeResponse;
}

const ScrapedDataDisplay: React.FC<ScrapedDataDisplayProps> = ({ data }) => {
  const [downloadingImages, setDownloadingImages] = useState<Set<number>>(
    new Set()
  );

  // Extract key information
  const { original_title, image_urls } = data;

  /**
   * Downloads a single image from URL via backend proxy
   */
  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      setDownloadingImages((prev) => new Set(prev).add(index));

      // Use backend proxy to download the image (bypasses CORS)
      const response = await fetch("/api/v1/scrape/download-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from URL or generate one
      const urlParts = imageUrl.split("/");
      const filename =
        urlParts[urlParts.length - 1].split("?")[0] ||
        `image_${index + 1}.webp`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
      alert("Failed to download image");
    } finally {
      setDownloadingImages((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  /**
   * Downloads all images as a zip (batch download)
   */
  const handleDownloadAllImages = async () => {
    try {
      setDownloadingImages(new Set([...Array(image_urls.length).keys()]));

      // Download each image sequentially
      for (let i = 0; i < image_urls.length; i++) {
        await handleDownloadImage(image_urls[i], i);
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Failed to download all images:", error);
      alert("Failed to download all images");
    } finally {
      setDownloadingImages(new Set());
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Header med titel */}
      <div className="border-b border-gray-700 p-4">
        <h3 className="text-xl font-bold text-white">{original_title}</h3>
        <p className="text-gray-400 text-sm mt-1">
          {image_urls?.length || 0} images found
        </p>
      </div>

      <div className="p-4">
        {/* Download all button */}
        {image_urls && image_urls.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleDownloadAllImages}
              disabled={downloadingImages.size > 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download all images
            </button>
          </div>
        )}

        {/* Image grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {image_urls?.map((url: string, index: number) => (
            <div
              key={index}
              className="aspect-square relative overflow-hidden rounded-lg border border-gray-700 group">
              <img
                src={url}
                alt={`${original_title} - bild ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Download overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleDownloadImage(url, index)}
                  disabled={downloadingImages.has(index)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors disabled:opacity-50"
                  title="Ladda ner bild">
                  {downloadingImages.has(index) ? (
                    <svg
                      className="animate-spin h-5 w-5"
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
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {(!image_urls || image_urls.length === 0) && (
          <p className="text-gray-400 text-center py-8">No images available</p>
        )}
      </div>
    </div>
  );
};

export default ScrapedDataDisplay;
