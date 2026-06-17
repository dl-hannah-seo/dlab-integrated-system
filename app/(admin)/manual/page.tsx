// 가맹 운영 매뉴얼 — 내부 정적 페이지.
// D.LAB 캠퍼스 운영 가이드(노션)의 핵심 구분을 시스템 내에서 바로 확인.
// 항목은 데스크 운영 참고용 정적 목록(외부 링크 아님).

interface ManualSection {
  title: string;
  items: string[];
}

const sections: ManualSection[] = [
  {
    title: '상담',
    items: [
      '학부모 상담 매뉴얼 표준화 가이드 (방문상담)',
      '설명회 신청자 프리인터뷰 (전화상담)',
      '상담 FAQ',
      'CT-TEST 상담',
      '정기 상담',
      '기타 상담',
      '디랩 커리큘럼',
      '수강료 및 교재·교구비',
      '설명회 자료',
      'SW진로진학',
      '수업 사진, 영상 발송',
    ],
  },
  {
    title: '수업',
    items: [
      'D.LAB 교안 관리',
      '엘리스 사용 가이드',
      '디랩온 사용 가이드',
      'Open LAB. 운영 방법',
      '노션 E-Portfolio 가이드',
      'Ex#PAGE 과정',
      '디랩 프로젝트 아카이빙',
      '디랩 대회·입시 산출물 아카이브',
      '면접 챗봇',
      '디랩 추천 대회리스트',
      '설명회·체험수업 프로세스',
      '학교별 수행평가 항목 및 방학일정 확인 방법',
      '방학특강 운영 가이드라인',
      '특강 운영',
      '개별 체험 수업 (상시)',
    ],
  },
  {
    title: 'AI 교육',
    items: [
      'Coding Triangle 소개서',
      'Altes 이용 가이드',
      '온라인 워크샵 자료',
      'AI 바이브 코딩 해커톤 운영',
      'MGT LAB 홍보 관련',
      '성인 AI교육 수업 자료',
    ],
  },
];

export default function ManualPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#37352F]">가맹 운영 매뉴얼</h1>
        <p className="mt-1.5 text-sm text-[#787774]">
          D.LAB 캠퍼스 운영 가이드 — 데스크 운영에 필요한 핵심 항목을 모았습니다.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-[#E9E9E7] bg-white overflow-hidden"
          >
            <h2 className="bg-[#F7F7F5] px-4 py-2.5 text-sm font-semibold text-[#37352F] border-b border-[#E9E9E7]">
              {section.title}
            </h2>
            <ul className="divide-y divide-[#F1F1EF]">
              {section.items.map((item) => (
                <li key={item} className="px-4 py-2.5 text-sm text-[#37352F]">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
