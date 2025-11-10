import { useState } from "react";
import { ListingEditor } from "../components/data-editor/ListingEditor";
import { FileExplorer } from "../components/data-editor/FileExplorer/FileExplorer";
import { CarListing } from "../libs/catalog/index.mjs";
import { State } from "../hooks/useSubstate";

function Data() {
  const [listing, setListing] = useState<CarListing | undefined>(undefined);
  const listingState: State<CarListing | undefined> = [listing, setListing];

  return (
    <div className="bg-gray-900 text-white min-h-screen py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">Data Editor</h1>

        <div className="mb-6">
          <FileExplorer state={listingState} />
        </div>

        {/* Main Content - Only show editor if a listing is loaded */}
        {listing && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 shadow-lg border border-gray-700">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl"></div>

            <div className="relative z-10">
              <ListingEditor state={[listing, setListing] as State<CarListing>} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Data;