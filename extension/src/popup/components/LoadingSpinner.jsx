export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-accent rounded-full animate-spin" />
    </div>
  );
}
