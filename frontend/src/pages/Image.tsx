import { useMemo, useState } from "react";
import Uploader from "../components/image-editor/Uploader";
import ProcessedImagesGallery from "../components/image-editor/ProcessedImagesGallery";
import { FileSystemDirectoryHandle } from "../components/image-editor/types/file-system.types";
import PageContainer from "@/components/PageContainer";

type ProcessedImage = {
  url: string;
  visualIndex: number;
  profile?: string;
};

function Image() {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [sourceDirHandle, setSourceDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  const handleImageProcessed = (
    url: string,
    visualIndex: number,
    profile?: string
  ) => {
    setProcessedImages((prev) => [...prev, { url, visualIndex, profile }]);
  };

  const handleImagesChanged = (updatedImages: string[]) => {
    // Keep the index and profile of the remaining images (matched by URL)
    setProcessedImages((prev) =>
      prev.filter((image) => updatedImages.includes(image.url))
    );
  };

  const handleSourceDirHandleChange = (
    dirHandle: FileSystemDirectoryHandle | null
  ) => {
    setSourceDirHandle(dirHandle);
  };

  const galleryImages = useMemo(
    () => ({
      urls: processedImages.map((image) => image.url),
      visualIndexes: processedImages.map((image) => image.visualIndex),
      profiles: processedImages.map((image) => image.profile),
    }),
    [processedImages]
  );

  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">Image Editor</h1>
        <p className="text-muted-foreground mb-6">
          Upload and process car images with our AI-powered background removal
          tool
        </p>

        <Uploader
          onImageProcessed={handleImageProcessed}
          onSourceDirHandleChange={handleSourceDirHandleChange}
        />

        <ProcessedImagesGallery
          images={galleryImages.urls}
          sourceDirHandle={sourceDirHandle}
          onImagesChanged={handleImagesChanged}
          visualIndexes={galleryImages.visualIndexes}
          profiles={galleryImages.profiles}
        />
      </PageContainer>
    </div>
  );
}

export default Image;
