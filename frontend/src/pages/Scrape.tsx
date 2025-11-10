import { useState } from "react";
import ScrapeForm from "../components/scrape-editor/ScrapeForm";
import ScrapedDataDisplay from "../components/scrape-editor/ScrapedDataDisplay";
import { type ScrapeResponse } from "../api/scrape-api";

function Scrape() {
  const [scrapedData, setScrapedData] = useState<ScrapeResponse | null>(null);

  const handleScrapeSuccess = (data: ScrapeResponse) => {
    setScrapedData(data);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">Scraping Images</h1>

        <div className="mb-6 flex border-b border-gray-700">
          <p className="px-4 py-2 font-medium focus:outline-none text-blue-500 border-b-2 border-blue-5000">
            Single URL Scraping
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ScrapeForm onSuccess={handleScrapeSuccess} />
          </div>

          <div>{scrapedData && <ScrapedDataDisplay data={scrapedData} />}</div>
        </div>
      </div>
    </div>
  );
}

export default Scrape;
