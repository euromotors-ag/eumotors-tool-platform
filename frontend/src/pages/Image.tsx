import { useState } from "react";
import Uploader from "../components/image-editor/Uploader";
import ProcessedImagesGallery from "../components/image-editor/ProcessedImagesGallery";
import { FileSystemDirectoryHandle } from "../components/image-editor/types/file-system.types";

function Image() {
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [sourceDirHandle, setSourceDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [visualIndexes, setVisualIndexes] = useState<number[]>([]); // Ändra från originalIndexes till visualIndexes

  const handleImageProcessed = (imageUrl: string, visualIndex: number) => {
    setProcessedImages((prev) => [...prev, imageUrl]);
    // Lägg till visualIndex
    setVisualIndexes((prev) => [...prev, visualIndex]);
  };

  const handleImagesChanged = (updatedImages: string[]) => {
    setProcessedImages(updatedImages);
    // Uppdatera visualIndexes för att matcha de kvarvarande bilderna
    setVisualIndexes((prev) => prev.slice(0, updatedImages.length));
  };

  const handleSourceDirHandleChange = (
    dirHandle: FileSystemDirectoryHandle | null
  ) => {
    setSourceDirHandle(dirHandle);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">Image Editor</h1>
        <p className="text-gray-500 mb-8">
          Upload and process car images with our AI-powered background removal
          tool
        </p>

        <div className="mb-8">
          <Uploader
            onImageProcessed={handleImageProcessed}
            onSourceDirHandleChange={handleSourceDirHandleChange}
          />
        </div>

        <ProcessedImagesGallery
          images={processedImages}
          sourceDirHandle={sourceDirHandle}
          onImagesChanged={handleImagesChanged}
          visualIndexes={visualIndexes} // Skicka med visualIndexes
        />
      </div>
    </div>
  );
}

export default Image;
