import { memo, useMemo } from "react";

interface Props {
  file: File;
  index: number;
  isSelected: boolean;
  isCurrentIndex: boolean;
  onClick: (index: number) => void;
}

const ImageThumbnail: React.FC<Props> = ({
  file,
  index,
  isSelected,
  isCurrentIndex,
  onClick,
}) => {
  // Memoize the object URL to prevent unnecessary re-renders
  const imageUrl = useMemo(() => {
    return URL.createObjectURL(file);
  }, [file.name, file.size, file.lastModified]);

  return (
    <div
      key={`thumb-${index}`}
      onClick={() => onClick(index)}
      className={`relative cursor-pointer overflow-hidden rounded 
        ${
          isSelected
            ? "p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            : "border border-gray-700"
        }
        ${isCurrentIndex && !isSelected ? "border-blue-500" : ""}`}>
      <div className="bg-gray-900 w-full h-full">
        <img
          src={imageUrl}
          alt={`Thumbnail ${index + 1}`}
          className={`w-full h-24 sm:h-28 lg:h-32 object-contain object-center transition-all duration-200 p-1 ${
            isSelected ? "grayscale brightness-50 opacity-70" : ""
          }`}
        />
      </div>
    </div>
  );
};

export default memo(ImageThumbnail, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.file.name === nextProps.file.name &&
    prevProps.file.size === nextProps.file.size &&
    prevProps.file.lastModified === nextProps.file.lastModified &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isCurrentIndex === nextProps.isCurrentIndex
  );
});
