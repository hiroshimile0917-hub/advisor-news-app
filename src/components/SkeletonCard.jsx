export default function SkeletonCard() {
  return (
    <div className="bg-[#161b22] rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-[#21262d] rounded-full" />
        <div className="h-5 w-8 bg-[#21262d] rounded-full" />
      </div>
      <div className="h-4 bg-[#21262d] rounded w-full" />
      <div className="h-4 bg-[#21262d] rounded w-4/5" />
      <div className="h-3 bg-[#21262d] rounded w-1/3" />
    </div>
  );
}
