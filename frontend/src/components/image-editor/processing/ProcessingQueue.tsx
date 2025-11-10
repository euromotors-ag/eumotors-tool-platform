import { useEffect } from "react";
import { ProfileType } from "../ProfileSelector";
import { useProcessingQueue } from "./hooks/useProcessingQueue";
import ProfileStatusList from "./ProfileStatusList";
import ProcessingControls from "./ProcessingControls";
import { ProfileStatus } from "../types/processing";

interface ProcessingQueueProps {
  selectedImages: number[];
  selectedProfile: ProfileType | null;
  selectedFiles: File[];
  visualOrder: number[];
  getCurrentVisualOrder: () => number[];
  onImageProcessed: (imageUrl: string, visualIndex: number) => void;
  onProcessSelected: () => void;
  onProfileStatusesChange?: (profileStatuses: ProfileStatus[]) => void;
  onGetJobDataForProfileChange?: (
    getJobDataForProfile: (
      profile: ProfileType
    ) => { files: File[]; visualOrder: number[] } | null
  ) => void;
}

export default function ProcessingQueue({
  selectedImages,
  selectedProfile,
  selectedFiles,
  visualOrder,
  getCurrentVisualOrder,
  onImageProcessed,
  onProcessSelected,
  onProfileStatusesChange,
  onGetJobDataForProfileChange,
}: ProcessingQueueProps) {
  const {
    addToQueue,
    startProcessing,
    clearQueue,
    queueSummary,
    profileStatuses,
    isProcessing,
    removeProfileFromQueue,
    getJobDataForProfile,
    updateVisualOrderForAllJobs,
  } = useProcessingQueue();

  // Update all processes when visual order changes
  useEffect(() => {
    if (visualOrder.length > 0) {
      updateVisualOrderForAllJobs(visualOrder, selectedFiles);
    }
  }, [visualOrder, selectedFiles, updateVisualOrderForAllJobs]);

  // Send profileStatuses and getJobDataForProfile to parent
  useEffect(() => {
    if (onProfileStatusesChange) {
      onProfileStatusesChange(profileStatuses);
    }
  }, [profileStatuses, onProfileStatusesChange]);

  useEffect(() => {
    if (onGetJobDataForProfileChange) {
      onGetJobDataForProfileChange(getJobDataForProfile);
    }
  }, [getJobDataForProfile, onGetJobDataForProfileChange]);

  const handleProcessSelected = () => {
    if (selectedImages.length === 0 || !selectedProfile) return;

    // Get the selected files based on selectedImages
    const selectedIndexes = selectedImages;
    const selectedFilesArray = selectedIndexes
      .map((index) => selectedFiles[index])
      .filter((file) => file !== undefined);

    // Get the latest visualOrder via callback to get the right index
    const currentVisualOrder = getCurrentVisualOrder();

    const visualIndexes = selectedIndexes
      .map((index) => currentVisualOrder.indexOf(index))
      .filter((i) => i !== -1);

    // Add to queue with actual files and visual order
    addToQueue(selectedFilesArray, selectedProfile, visualIndexes);

    // Clear selection after images are added to queue
    onProcessSelected();
  };

  const hasQueueItems = queueSummary.length > 0;
  const hasSelectedImages = selectedImages.length > 0;

  const handleStartProcessing = async () => {
    if (isProcessing) return;

    try {
      await startProcessing(onImageProcessed);
    } catch (error) {
      console.error("Error in handleStartProcessing:", error);
    }
  };

  const handleClearQueue = () => {
    clearQueue();
  };

  return (
    <div className="mt-6">
      {/* Profile Status List */}
      <ProfileStatusList
        profileStatuses={profileStatuses}
        onRemoveProfile={removeProfileFromQueue}
        getJobDataForProfile={getJobDataForProfile}
      />

      {/* Processing Controls */}
      <ProcessingControls
        onProcessSelected={handleProcessSelected}
        onStartProcessing={handleStartProcessing}
        onClearQueue={handleClearQueue}
        hasSelectedImages={hasSelectedImages}
        hasQueueItems={hasQueueItems}
        isProcessing={isProcessing}
        selectedCount={selectedImages.length}
      />
    </div>
  );
}
