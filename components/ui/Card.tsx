import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', titleClassName = '', title, action }: CardProps) {
  return (
    <div className={`bg-white border border-[#EEF1F5] rounded-2xl shadow-[0_2px_8px_rgba(20,30,55,0.05)] ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-[#EEF1F5] ${titleClassName}`}>
          {title && <h3 className="text-base font-semibold text-[#1A1D29]">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
