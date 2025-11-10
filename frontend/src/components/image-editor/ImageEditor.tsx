import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { AspectRatio, ASPECT_RATIOS } from "./CropImage";

interface ImageEditorProps {
  imageFile: File;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: File) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageEditor = ({
  imageFile,
  isOpen,
  onClose,
  onSave,
}: ImageEditorProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4/3");
  const [isSaving, setIsSaving] = useState(false);

  // Create URL for the image
  const imageUrl = URL.createObjectURL(imageFile);

  // Handle crop changes
  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((newAspectRatio: AspectRatio) => {
    setAspectRatio(newAspectRatio);
    // Reset crop position when changing aspect ratio
    setCrop({ x: 0, y: 0 });
  }, []);

  // Save the cropped image
  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels || isSaving) return;

    setIsSaving(true);

    try {
      // Create canvas to draw the cropped image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      // Create a new image to load the original image
      const image = new Image();
      image.src = imageUrl;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      // Set canvas size to the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply flip transformations
      if (flip.horizontal || flip.vertical) {
        ctx.save();

        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Apply flip transformations
        if (flip.horizontal) {
          ctx.scale(-1, 1);
        }
        if (flip.vertical) {
          ctx.scale(1, -1);
        }

        // Move back to top-left corner
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Draw the cropped part of the image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Restore context if transformations were applied
      if (flip.horizontal || flip.vertical) {
        ctx.restore();
      }

      const blobPromise = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        });
      });

      const blob = await blobPromise;

      const croppedFile = new File([blob], imageFile.name, {
        type: imageFile.type,
      });

      onSave(croppedFile);
      onClose();
    } catch (error) {
      console.error("Error saving cropped image:", error);
    } finally {
      setIsSaving(false);
    }
  }, [croppedAreaPixels, imageUrl, imageFile, onSave, onClose, flip, isSaving]);

  // Clean URL when component is closed
  const handleClose = useCallback(() => {
    URL.revokeObjectURL(imageUrl);
    onClose();
  }, [imageUrl, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Edit image</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 cursor-pointer hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Easy instruction */}
        <div className="mb-4  w-100 text-sm text-gray-300">
          Drag to move, scroll to zoom, click for crop aspect ratio
        </div>

        {/* Aspect Ratio Buttons */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-white text-sm">Aspect Ratio:</span>
          {(["4/3", "16/9", "1/2"] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              className={`px-3 cursor-pointer py-1 text-sm rounded transition-colors ${
                aspectRatio === ratio
                  ? "bg-blue-600 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}>
              {ratio}
            </button>
          ))}
        </div>

        {/* Flip controls */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-white text-sm">Flip:</span>
          <button
            onClick={() =>
              setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }))
            }
            className={`px-3 cursor-pointer py-1 text-sm rounded transition-colors ${
              flip.horizontal
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}>
            Horizontal
          </button>
          <button
            onClick={() =>
              setFlip((prev) => ({ ...prev, vertical: !prev.vertical }))
            }
            className={`px-3 py-1 cursor-pointer text-sm rounded transition-colors ${
              flip.vertical
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}>
            Vertical
          </button>
        </div>

        {/* Zoom controller */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-white text-sm">Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Cropper container */}
        <div
          className="border border-gray-600 rounded-lg overflow-hidden mb-4 relative"
          style={{ height: "500px" }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_RATIOS[aspectRatio]}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            minZoom={0.5}
            maxZoom={3}
            restrictPosition={false}
            zoomWithScroll={true}
            zoomSpeed={0.05}
            transform={[
              `translate(${crop.x}px, ${crop.y}px)`,
              `rotateY(${flip.horizontal ? 180 : 0}deg)`,
              `rotateX(${flip.vertical ? 180 : 0}deg)`,
              `scale(${zoom})`,
            ].join(" ")}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                backgroundColor: "#000",
              },
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 cursor-pointer text-white rounded hover:bg-gray-500">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!croppedAreaPixels || isSaving}
            className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2">
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
