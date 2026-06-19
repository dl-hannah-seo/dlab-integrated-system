import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  suffix?: string;
}

export function Input({ label, error, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#1A1D29]">{label}</label>}
      <div className="relative flex items-center">
        <input
          className={`w-full bg-white border border-[#E8EBF1] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1D29] placeholder:text-[#AEB4C0] focus:outline-none focus:border-[#2F6BFF] focus:border-2 transition-colors disabled:bg-[#F4F6FA] disabled:text-[#6B7280] ${suffix ? 'pr-10' : ''} ${error ? 'border-[#F2474B]' : ''} ${className}`}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-sm text-[#6B7280]">{suffix}</span>}
      </div>
      {error && <span className="text-xs text-[#F2474B]">{error}</span>}
    </div>
  );
}

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type'> {
  label?: React.ReactNode;
  error?: string;
  suffix?: string;
  value?: number;                       // 제어형: 외부 상태 사용
  defaultValue?: number;                // 비제어형: 내부 상태 사용
  onValueChange?: (n: number) => void;  // 변경 시 숫자값 전달
}

/** 천 단위 쉼표를 표시하는 숫자(금액) 입력. 자릿수가 한눈에 보이도록 함. */
export function MoneyInput({ label, error, suffix, value, defaultValue, onValueChange, ...props }: MoneyInputProps) {
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState<number>(defaultValue ?? 0);
  const current = isControlled ? (value as number) : inner;
  const display = current ? current.toLocaleString('ko-KR') : '';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
    if (!isControlled) setInner(n);
    onValueChange?.(n);
  }

  return (
    <Input
      {...props}
      label={label}
      error={error}
      suffix={suffix}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-[#1A1D29]">{label}</label>}
      <textarea
        className={`w-full bg-white border border-[#E8EBF1] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1D29] placeholder:text-[#AEB4C0] focus:outline-none focus:border-[#2F6BFF] focus:border-2 transition-colors resize-none disabled:bg-[#F4F6FA] ${error ? 'border-[#F2474B]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#F2474B]">{error}</span>}
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
      {label && <label className="text-sm font-medium text-[#1A1D29]">{label}</label>}
      <select
        className={`w-full border border-[#E8EBF1] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1D29] focus:outline-none focus:border-[#2F6BFF] focus:border-2 transition-colors bg-white ${error ? 'border-[#F2474B]' : ''} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-[#F2474B]">{error}</span>}
    </div>
  );
}
