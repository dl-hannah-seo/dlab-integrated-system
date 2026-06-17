import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  suffix?: string;
}

export function Input({ label, error, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#37352F]">{label}</label>}
      <div className="relative flex items-center">
        <input
          className={`w-full bg-white border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] placeholder:text-[#BEBDBA] focus:outline-none focus:border-[#FF6C37] transition-colors disabled:bg-[#F7F7F5] disabled:text-[#787774] ${suffix ? 'pr-10' : ''} ${error ? 'border-[#EB5757]' : ''} ${className}`}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-sm text-[#787774]">{suffix}</span>}
      </div>
      {error && <span className="text-xs text-[#EB5757]">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#37352F]">{label}</label>}
      <textarea
        className={`w-full bg-white border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] placeholder:text-[#787774] focus:outline-none focus:border-[#FF6C37] transition-colors resize-none disabled:bg-[#F7F7F5] ${error ? 'border-[#EB5757]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#EB5757]">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#37352F]">{label}</label>}
      <select
        className={`w-full border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37] transition-colors bg-white ${error ? 'border-[#EB5757]' : ''} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-[#EB5757]">{error}</span>}
    </div>
  );
}
