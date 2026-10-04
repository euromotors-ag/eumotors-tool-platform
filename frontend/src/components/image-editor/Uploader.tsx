import { useState, useCallback, useMemo, useRef } from "react";
import MultipleImageUploader from "./MultipleImageUploader";
import ProfileSelector, { ProfileType } from "./ProfileSelector";
import ImageGrid from "./ImageGrid";
import ProcessingQueue from "./processing/ProcessingQueue";
import ProcessingIndicator from "./processing/ProcessingIndicator";
import { useImageSelection } from "../../hooks/useImageSelection";
import { useBatchProcessing } from "../../hooks/useBatchProcessing";
import { ProfileStatus } from "./types/processing";
import { FileSystemDirectoryHandle } from "./types/file-system.types";

interface Props {
  onImageProcessed: (
    imageUrl: string,
    visualIndex: number,
    profile?: string
  ) => void;
  onSourceDirHandleChange: (
    dirHandle: FileSystemDirectoryHandle | null
  ) => void;
  onResetProcessedImages?: () => void;
}

const Uploader = ({
  onImageProcessed,
  onSourceDirHandleChange,
  onResetProcessedImages,
}: Props) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileType>("eumotors");
  const [visualOrder, setVisualOrder] = useState<number[]>([]);

  // State för att hantera bilder i process
  const [profileStatuses, setProfileStatuses] = useState<ProfileStatus[]>([]);
  const getJobDataForProfileRef = useRef<
    | ((
        profile: ProfileType
      ) => { files: File[]; visualOrder: number[] } | null)
    | null
  >(null);

  // Callbacks för att hantera data från ProcessingQueue
  const handleProfileStatusesChange = useCallback(
    (newProfileStatuses: ProfileStatus[]) => {
      setProfileStatuses(newProfileStatuses);
    },
    []
  );

  const handleGetJobDataForProfileChange = useCallback(
    (
      newGetJobDataForProfile: (
        profile: ProfileType
      ) => { files: File[]; visualOrder: number[] } | null
    ) => {
      getJobDataForProfileRef.current = newGetJobDataForProfile;
    },
    []
  );

  // Custom hooks for managing image selection and processing
  const {
    selectedImages,
    currentIndex,
    toggleImageSelection,
    resetSelection,
    toggleAllSelection,
  } = useImageSelection(selectedFiles);

  const { isLoading } = useBatchProcessing((url: string) => {
    onImageProcessed(url, currentIndex);
  });

  const handleProcessSelected = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  const handleMultipleImagesSelected = (files: File[]) => {
    setSelectedFiles(files);
    resetSelection();
    setVisualOrder(files.map((_, i) => i));
  };

  const handleResetAll = useCallback(() => {
    setSelectedFiles([]);
    resetSelection();
    setVisualOrder([]);

    // Also clear processed images through the parent component
    if (onResetProcessedImages) {
      onResetProcessedImages();
    }
  }, [resetSelection, onResetProcessedImages]);

  const handleImageDeleted = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      resetSelection();

      // Uppdatera visuell ordning efter borttagning
      setVisualOrder((prev) =>
        prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
      );

      // Notera parent om ändringar
      if (onResetProcessedImages) {
        onResetProcessedImages();
      }
    },
    [selectedFiles, resetSelection, onResetProcessedImages]
  );

  // Hantera redigerade bilder
  const handleImageEdited = useCallback(
    (originalIndex: number, editedFile: File) => {
      // Ersätt den ursprungliga bilden med den redigerade
      const newFiles = [...selectedFiles];
      newFiles[originalIndex] = editedFile;
      setSelectedFiles(newFiles);

      // Notera parent om ändringar
      if (onResetProcessedImages) {
        onResetProcessedImages();
      }
    },
    [selectedFiles, onResetProcessedImages]
  );

  const handleReorderImages = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      // Create a new array with the reordered images
      const reorderedFiles = Array.from(selectedFiles);
      const [movedFile] = reorderedFiles.splice(sourceIndex, 1);
      reorderedFiles.splice(destinationIndex, 0, movedFile);

      // Update the files array
      setSelectedFiles(reorderedFiles);

      // Uppdatera visuell ordning
      setVisualOrder((prev) => {
        const newOrder = [...prev];
        const [movedItem] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destinationIndex, 0, movedItem);
        return newOrder;
      });
    },
    [selectedFiles]
  );

  const getCurrentVisualOrder = useCallback(() => visualOrder, [visualOrder]);

  const handleImageProcessed = useCallback(
    (imageUrl: string, visualIndex: number, profile: string) => {
      onImageProcessed(imageUrl, visualIndex, profile);
    },
    [onImageProcessed]
  );

  // Callback för att hantera visuell ordning ändringar från ImageGrid
  const handleVisualOrderChange = useCallback((newVisualOrder: number[]) => {
    setVisualOrder(newVisualOrder);
  }, []);

  const getImagesInProcess = useMemo(() => {
    const imagesInProcess: File[] = [];

    // Använd profileStatuses från ProcessingQueue för att hämta bilder i process
    if (
      profileStatuses &&
      profileStatuses.length > 0 &&
      getJobDataForProfileRef.current
    ) {
      profileStatuses.forEach((status) => {
        const jobData = getJobDataForProfileRef.current!(
          status.profile as ProfileType
        );
        if (jobData && jobData.files) {
          imagesInProcess.push(...jobData.files);
        }
      });
    }

    return imagesInProcess;
  }, [profileStatuses]);

  return (
    <div className="w-full">
      <MultipleImageUploader
            uploadId="car-images-upload"
            onImagesSelected={handleMultipleImagesSelected}
            maxFileCount={30}
            accept="image/png,image/jpeg,image/webp"
            labelText="Upload Car Images"
            onResetAll={handleResetAll}
            onSourceDirHandleChange={onSourceDirHandleChange}
          />

          {selectedFiles.length > 0 && (
            <>
              <div className="mt-15">
                <ProfileSelector
                  selectedProfile={selectedProfile}
                  setSelectedProfile={setSelectedProfile}
                />
              </div>

              <div className="mt-10">
                <ImageGrid
                  files={selectedFiles}
                  selectedImages={selectedImages}
                  selectedIndex={currentIndex}
                  onImageClick={toggleImageSelection}
                  onReorder={handleReorderImages}
                  onImageDeleted={handleImageDeleted}
                  onToggleAllSelection={toggleAllSelection}
                  selectedFiles={selectedFiles}
                  onVisualOrderChange={handleVisualOrderChange}
                  imagesInProcess={getImagesInProcess} // Skicka med bilder i process
                  onImageEdited={handleImageEdited} // Skicka med callback för redigerade bilder
                />

                <ProcessingQueue
                  selectedImages={Array.from(selectedImages)}
                  selectedProfile={selectedProfile}
                  selectedFiles={selectedFiles}
                  visualOrder={visualOrder}
                  getCurrentVisualOrder={getCurrentVisualOrder}
                  onImageProcessed={handleImageProcessed}
                  onProcessSelected={handleProcessSelected}
                  onProfileStatusesChange={handleProfileStatusesChange}
                  onGetJobDataForProfileChange={
                    handleGetJobDataForProfileChange
                  }
                />
              </div>
            </>
          )}

      {/* Shown during processing */}
      {isLoading && (
        <div className="mt-6 rounded-lg bg-gray-700 p-2 shadow-sm">
          <ProcessingIndicator
            profile={selectedProfile}
            onCancel={() => {
              // This function is no longer used, but keeping it as per instructions
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Uploader;
