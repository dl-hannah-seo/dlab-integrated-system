'use client';

// 가맹 운영 매뉴얼 — 내부 정적 페이지.
// 카테고리(상담·수업·교육·행정·홍보·문서)별 일반 항목만 노출하고,
// 항목 클릭 시 "준비중" 안내 창을 표시한다. (콘텐츠 준비 전)

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ManualSection {
  title: string;
  items: string[];
}

const sections: ManualSection[] = [
  {
    title: '상담',
    items: [
      '신규 상담 프로세스',
      '학부모 상담 가이드',
      '상담 FAQ',
      '재원생 정기 상담',
    ],
  },
  {
    title: '수업',
    items: [
      '수업 운영 가이드',
      '교안 관리',
      '체험수업 프로세스',
      '특강·방학특강 운영',
    ],
  },
  {
    title: '교육',
    items: [
      '강사 교육 프로그램',
      '신규 강사 온보딩',
      '커리큘럼 이해',
      '교육 플랫폼 사용법',
    ],
  },
  {
    title: '행정',
    items: [
      '수납·정산 관리',
      '출결 관리',
      '학생·반 등록',
      '인사·근태 관리',
    ],
  },
  {
    title: '홍보',
    items: [
      '채널별 홍보 가이드',
      '설명회 운영',
      'SNS·블로그 운영',
      '홍보물 제작 가이드',
    ],
  },
  {
    title: '문서',
    items: [
      '운영 표준 양식',
      '계약·동의서 서식',
      '공지·안내문 템플릿',
      '보고서 양식',
    ],
  },
];

export default function ManualPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1D29]">가맹 운영 매뉴얼</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-[#E8EBF1] bg-white overflow-hidden"
          >
            <h2 className="bg-[#F4F6FA] px-4 py-2.5 text-sm font-semibold text-[#1A1D29] border-b border-[#E8EBF1]">
              {section.title}
            </h2>
            <ul className="divide-y divide-[#EEF1F5]">
              {section.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setOpenItem(item)}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#1A1D29] hover:bg-[#F4F6FA] hover:text-[#2F6BFF] transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Modal
        open={openItem !== null}
        onClose={() => setOpenItem(null)}
        title={openItem ?? ''}
        footer={<Button onClick={() => setOpenItem(null)}>확인</Button>}
      >
        <div className="py-6 text-center">
          <p className="text-base font-medium text-[#1A1D29]">아직 준비중입니다.</p>
          <p className="mt-1.5 text-sm text-[#6B7280]">해당 매뉴얼 콘텐츠는 곧 제공될 예정입니다.</p>
        </div>
      </Modal>
    </div>
  );
}
