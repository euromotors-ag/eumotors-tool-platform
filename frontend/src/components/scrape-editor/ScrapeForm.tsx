import { useState } from "react";
import LoadSpinner from "../ui/LoadSpinner";
import { scrapeUrl, type ScrapeResponse } from "../../api/scrape-api";

interface ScrapeFormProps {
  onSuccess: (data: ScrapeResponse) => void;
}

const ScrapeForm: React.FC<ScrapeFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await scrapeUrl(url);
      onSuccess(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ett oväntat fel inträffade vid skrapning";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">
        Scrape a Vehicle Listing
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Listing URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.blocket.se/annons/stockholm/..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-400">
            Supports Blocket.se URL ONLY
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !url}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <LoadSpinner size="sm" />
                <span>Scraping...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  />
                </svg>
                <span>Scrape Now</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ScrapeForm;
