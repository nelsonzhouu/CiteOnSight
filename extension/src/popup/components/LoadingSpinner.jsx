export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>
  );
}
