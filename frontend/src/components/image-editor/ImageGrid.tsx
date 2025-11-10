import { useRef, useState, useEffect } from "react";
import ImageThumbnail from "./ImageThumbnail";
import ImageEditor from "./ImageEditor";
import { useToastContext } from "../../hooks/useToast";

interface Props {
  files: File[];
  selectedImages: Set<number>;
  selectedIndex: number;
  onImageClick: (index: number) => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
  onImageDeleted?: (index: number) => void;
  onToggleAllSelection: () => void;
  selectedFiles: File[];
  onVisualOrderChange?: (visualOrder: number[]) => void;
  imagesInProcess?: File[];
  onImageEdited?: (originalIndex: number, editedFile: File) => void;
}

const ImageGrid = ({
  files,
  selectedImages,
  selectedIndex,
  onImageClick,
  onReorder,
  onImageDeleted,
  onToggleAllSelection,
  selectedFiles,
  onVisualOrderChange,
  imagesInProcess = [],
  onImageEdited,
}: Props) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [visualOrder, setVisualOrder] = useState<number[]>([]);

  const { success } = useToastContext();

  // State for ImageEditor
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);

  // Set visual order when files are loaded
  useEffect(() => {
    const indexes = files.map((_, i) => i);
    setVisualOrder(indexes);
  }, [files]);

  // Meddela parent komponenten när visuell ordning ändras
  useEffect(() => {
    if (onVisualOrderChange && visualOrder.length > 0) {
      onVisualOrderChange(visualOrder);
    }
  }, [visualOrder, onVisualOrderChange]);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (
      onReorder &&
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const fromIndex = dragItem.current;
      const toIndex = dragOverItem.current;

      const newVisualOrder = [...visualOrder];
      const [movedItem] = newVisualOrder.splice(fromIndex, 1);
      newVisualOrder.splice(toIndex, 0, movedItem);
      setVisualOrder(newVisualOrder);

      onReorder(fromIndex, toIndex);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const isSelected = (visualIndex: number) => {
    const originalIndex = visualOrder[visualIndex];
    if (originalIndex !== undefined && originalIndex < files.length) {
      return selectedImages.has(originalIndex);
    }
    return false;
  };

  const handleImageClick = (visualIndex: number) => {
    const originalIndex = visualOrder[visualIndex];
    if (originalIndex !== undefined && originalIndex < files.length) {
      onImageClick(originalIndex);
    }
  };

  const handleImageDelete = (visualIndex: number) => {
    const originalIndex = visualOrder[visualIndex];
    if (onImageDeleted && originalIndex !== undefined) {
      // ENKEL kontroll: är denna bild i process?
      const fileToDelete = files[originalIndex];
      if (imagesInProcess.some((processFile) => processFile === fileToDelete)) {
        return;
      }
      onImageDeleted(originalIndex);
      success("Image deleted");

      // Update visual order after deletion
      const newVisualOrder = visualOrder.filter((_, i) => i !== visualIndex);
      setVisualOrder(newVisualOrder);
    }
  };

  const handleImageEdit = (visualIndex: number) => {
    const originalIndex = visualOrder[visualIndex];
    if (originalIndex !== undefined && originalIndex < files.length) {
      const fileToEdit = files[originalIndex];

      if (imagesInProcess.some((processFile) => processFile === fileToEdit)) {
        return;
      }
      setEditingImageFile(fileToEdit);
      setIsImageEditorOpen(true);
    }
  };

  const handleImageEditorClose = () => {
    setIsImageEditorOpen(false);
    setEditingImageFile(null);
  };

  const handleImageEditorSave = (croppedImage: File) => {
    if (editingImageFile) {
      const originalIndex = files.findIndex(
        (file) => file === editingImageFile
      );
      if (originalIndex !== -1 && onImageEdited) {
        const editedFile = new File(
          [croppedImage],
          `edited-${croppedImage.name}`,
          {
            type: croppedImage.type,
          }
        );
        onImageEdited(originalIndex, editedFile);
        success("Image edited and saved");
      }
    }

    handleImageEditorClose();
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-3">
        <h3 className="text-xl font-semibold text-white mb-2">Select Images</h3>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-xs text-gray-400">
            Click to <strong>select</strong> for processing. Click again to{" "}
            <strong>deselect</strong>. Drag to <strong>reorder</strong> images.
          </p>
          <button
            onClick={onToggleAllSelection}
            className="cursor-pointer text-xs text-blue-400 hover:text-blue-300">
            {selectedImages.size === selectedFiles.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {visualOrder.map((originalIndex, visualIndex) => {
          const file = files[originalIndex];
          const isImageSelected = isSelected(visualIndex);

          if (!file) {
            return null;
          }

          return (
            <div
              key={`file-${originalIndex}`}
              draggable={true}
              onDragStart={() => handleDragStart(visualIndex)}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(visualIndex)}
              onDragEnd={handleDragEnd}
              className="relative cursor-grab active:cursor-grabbing">
              <div className="relative">
                {/* Order number indicator - visar visuell index (1-baserad) */}
                <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-[7px] py-[2px] m-1 rounded z-10 cursor-default">
                  {visualIndex + 1}
                </div>

                {/* Edit indicator - visar om bilden har redigerats */}
                {file.name.includes("edited") && (
                  <div className="absolute bottom-0 right-6 bg-green-600/70 text-white text-xs p-[2px] py-[2px] m-1 rounded z-10 cursor-default">
                    ✏️
                  </div>
                )}

                {/* Drag handle icon */}
                <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 m-1 rounded z-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>

                {/* Delete button */}
                {onImageDeleted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDelete(visualIndex);
                    }}
                    className={`absolute top-0 right-0 p-1 m-1 rounded z-10 text-xs ${
                      imagesInProcess.some(
                        (processFile) => processFile === file
                      )
                        ? "bg-gray-500 cursor-not-allowed opacity-50"
                        : "bg-black/70 hover:bg-black/80 hover:cursor-pointer"
                    } text-white`}
                    title={
                      imagesInProcess.some(
                        (processFile) => processFile === file
                      )
                        ? "Denna bild kan inte tas bort - den är för närvarande i process"
                        : "Ta bort bild"
                    }
                    disabled={imagesInProcess.some(
                      (processFile) => processFile === file
                    )}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageEdit(visualIndex);
                  }}
                  className={`absolute bottom-0 right-0 p-1 m-1 rounded z-10 text-xs ${
                    imagesInProcess.some((processFile) => processFile === file)
                      ? "bg-gray-500 cursor-not-allowed opacity-50"
                      : "bg-black/70 hover:bg-black/80 hover:cursor-pointer"
                  } text-white`}
                  title={
                    imagesInProcess.some((processFile) => processFile === file)
                      ? "Denna bild kan inte redigeras - den är för närvarande i process"
                      : "Redigera bild"
                  }
                  disabled={imagesInProcess.some(
                    (processFile) => processFile === file
                  )}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                <ImageThumbnail
                  file={file}
                  index={visualIndex}
                  isSelected={isImageSelected}
                  isCurrentIndex={
                    originalIndex === selectedIndex &&
                    selectedIndex !== undefined
                  }
                  onClick={() => handleImageClick(visualIndex)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ImageEditor Modal */}
      {isImageEditorOpen && editingImageFile && (
        <ImageEditor
          imageFile={editingImageFile}
          isOpen={isImageEditorOpen}
          onClose={handleImageEditorClose}
          onSave={handleImageEditorSave}
        />
      )}
    </>
  );
};

export default ImageGrid;
