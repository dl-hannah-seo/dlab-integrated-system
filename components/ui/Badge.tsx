import React from 'react';

type BadgeVariant =
  | 'attend' | 'absent' | 'pending' | 'makeup'
  | 'paid' | 'unpaid' | 'partial'
  | 'active' | 'inactive' | 'withdrawn'
  | 'primary' | 'success' | 'warn' | 'danger' | 'default';

const variantClass: Record<BadgeVariant, string> = {
  attend:    'badge-attend',
  absent:    'badge-absent',
  pending:   'badge-pending',
  makeup:    'badge-makeup',
  paid:      'badge-paid',
  unpaid:    'badge-danger',
  partial:   'badge-warn',
  active:    'badge-confirmed',
  inactive:  'badge-completed',
  withdrawn: 'badge-completed',
  primary:   'badge-submitted',
  success:   'badge-confirmed',
  warn:      'badge-warn',
  danger:    'badge-danger',
  default:   'badge-completed',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** 출결 상태 점 표시 */
export function AttendanceDot({ status }: { status: 'attend' | 'absent' | 'pending' | 'makeup' }) {
  const colors = {
    attend:  'bg-[#28C76F]',
    absent:  'bg-[#F2474B]',
    pending: 'border-2 border-[#9CA3AF] bg-transparent',
    makeup:  'bg-[#C18A14]',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}
