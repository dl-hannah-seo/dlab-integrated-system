import React from 'react';

interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/**
 * 표준 삭제 트리거.
 * 모든 삭제 동작은 솔리드 버튼이 아닌 약화된 빨강 텍스트 링크로 노출한다.
 * (오클릭 위험을 낮추고, 위험한 동작을 시각적으로 절제) 실제 삭제 확정은
 * 확인 모달 내부의 `<Button variant="danger">`가 담당한다.
 */
export function DeleteButton({ children, className = '', ...props }: DeleteButtonProps) {
  return (
    <button
      type="button"
      className={`text-sm text-[#EB5757] hover:underline ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
