import React from 'react';

interface CometCardProps {
  children: React.ReactNode;
  className?: string;
}

export function CometCard({ children, className = "" }: CometCardProps) {
  return (
    <div className={`relative rounded-[24px] overflow-hidden ${className}`}>
      {/* Content wrapper with transparent background */}
      <div className="relative z-10 w-full h-full rounded-[23px] bg-transparent overflow-hidden">
        {children}
      </div>
    </div>
  );
}

