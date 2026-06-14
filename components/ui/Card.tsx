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
    <div className={`bg-white border border-[#E9E9E7] rounded-lg ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7] ${titleClassName}`}>
          {title && <h3 className="text-base font-semibold text-[#37352F]">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
