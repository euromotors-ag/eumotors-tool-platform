interface Props {
  size?: "sm" | "md" | "lg";
  color?: "coral" | "blue-500" | "gray-500" | "carbon";
  className?: string;
}

const LoadSpinner: React.FC<Props> = ({
  size = "md",
  color = "blue-500",
  className = "",
}) => {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const getColorClass = () => {
    switch (color) {
      case "blue-500":
        return "border-blue-500";
      case "coral":
        return "border-coral";
      case "gray-500":
        return "border-gray-500";
      case "carbon":
        return "border-carbon";
      default:
        return "border-blue-500";
    }
  };

  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <div
        className={`${
          sizeMap[size]
        } animate-spin rounded-full border-b-2 border-t-2 ${getColorClass()}`}
        role="status"
        aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadSpinner;
