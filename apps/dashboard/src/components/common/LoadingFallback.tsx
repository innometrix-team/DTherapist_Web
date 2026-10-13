import React from "react";

export const LoadingFallback: React.FC = () => (
  <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-xs font-medium text-neutral">Loading…</span>
    </div>
  </div>
);

export default LoadingFallback;
