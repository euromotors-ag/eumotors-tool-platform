import LoadSpinner from "../../ui/LoadSpinner";

interface Props {
  profile: string;
  onCancel: () => void;
}

export default function ProcessingIndicator({ profile, onCancel }: Props) {
  const getProcessingMessage = (profile: string) => {
    switch (profile) {
      case "removebg":
        return "Removing background";
      default:
        return `Processing with ${profile} profile`;
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-gray-700 bg-gray-800 p-6">
      <LoadSpinner color="blue-500" size="md" />
      <p className="text-sm text-gray-300">{getProcessingMessage(profile)}</p>
      <button
        onClick={handleCancelClick}
        className="cursor-pointer mt-3 rounded bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm text-white border border-gray-600">
        Cancel
      </button>
    </div>
  );
}
