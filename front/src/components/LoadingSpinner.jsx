export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 dark:border-gray-600"></div>
    </div>
  );
}
