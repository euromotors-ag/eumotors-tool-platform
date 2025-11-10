import { useState, useEffect, useCallback } from "react";

export function useImageSelection(files: File[]) {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    setAllSelected(selectedImages.size === files.length && files.length > 0);
  }, [selectedImages, files]);

  const toggleImageSelection = useCallback((index: number) => {
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);

      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }

      return newSelection;
    });
    setCurrentIndex(index);
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (allSelected) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(files.map((_, i) => i)));
    }
  }, [allSelected, files]);

  const resetSelection = useCallback(() => {
    setSelectedImages(new Set());
    setCurrentIndex(0);
  }, []);

  return {
    selectedImages,
    currentIndex,
    allSelected,
    toggleImageSelection,
    toggleAllSelection,
    setCurrentIndex,
    resetSelection,
  };
}
