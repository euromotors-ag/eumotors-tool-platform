interface Props {
  onProcessSelected: () => void;
  onStartProcessing: () => void;
  onClearQueue: () => void;
  hasSelectedImages: boolean;
  hasQueueItems: boolean;
  isProcessing: boolean;
  selectedCount: number;
}

const ProcessingControls: React.FC<Props> = ({
  onProcessSelected,
  onStartProcessing,
  onClearQueue,
  hasSelectedImages,
  hasQueueItems,
  isProcessing,
  selectedCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      {/* Process Selected Button */}
      <button
        onClick={onProcessSelected}
        disabled={!hasSelectedImages || isProcessing}
        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
          hasSelectedImages && !isProcessing
            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}>
        {hasSelectedImages
          ? `Process ${selectedCount} Selected`
          : "No Images Selected"}
      </button>

      {/* Start Processing Button */}
      <button
        onClick={onStartProcessing}
        disabled={!hasQueueItems || isProcessing}
        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
          hasQueueItems && !isProcessing
            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}>
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing Queue...</span>
          </div>
        ) : hasQueueItems ? (
          "Start Processing"
        ) : (
          "Queue Empty"
        )}
      </button>

      {/* Clear Queue Button */}
      {hasQueueItems && (
        <button
          onClick={onClearQueue}
          disabled={isProcessing}
          className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
            !isProcessing
              ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-500/50"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}>
          Clear Queue
        </button>
      )}
    </div>
  );
};

export default ProcessingControls;
