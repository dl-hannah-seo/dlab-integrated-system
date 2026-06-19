'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LabBenchmarkCard } from '@/components/ai/LabBenchmarkCard';
import { WithdrawAnalysisCard } from '@/components/ai/WithdrawAnalysisCard';

const AI_SUMMARIES = [
  {
    id: 'payment',
    icon: '💳',
    title: '수납 현황 요약',
    badge: '6월 기준',
    summary: `이번 달 전체 78명 중 62명(79.5%)이 수강료를 납부했습니다. 미납 16명의 평균 체납 기간은 12.3일이며, 이 중 3명은 2개월 연속 미납 상태입니다.

주요 미납 원인: 자동이체 실패(6명), 응답 없음(7명), 분납 요청(3명).

권장 조치: 오늘 내로 미납 8명에게 결제 URL 문자 재발송을 권장합니다. 2개월 연속 미납자 3명은 개별 전화 상담이 필요합니다.`,
    insight: '미납률이 지난달 대비 3.2%p 개선되었습니다. 결제 URL 문자 발송 이후 당일 결제율이 높은 편입니다.',
  },
  {
    id: 'attendance',
    icon: '📊',
    title: '출결 패턴 분석',
    badge: '최근 4주',
    summary: `주간 평균 출석률은 91.2%로 양호한 수준입니다. 토 09:00반이 95.8%로 가장 높고, 화목 18:00 아두이노반이 88.5%로 상대적으로 낮습니다.

결석 사유 분포: 병결 45%, 가족 일정 28%, 학교 행사 18%, 무단 9%.

특이 사항: 김민준(s-01) 학생이 연속 출석 25일 달성 예정입니다. 이번 주 토 09:00반에서 4명이 연속 결석 위험군으로 분류됩니다.`,
    insight: '주간 출석률이 지속 상승 추세입니다. 포인트 시스템 도입 이후 무단 결석이 22% 감소했습니다.',
  },
  {
    id: 'retention',
    icon: '🏫',
    title: '원생 이탈 위험 분석',
    badge: 'AI 예측',
    summary: `현재 재원생 78명 중 7명이 이탈 위험 고위험군으로 분류됩니다.

고위험군 특징: 연속 결석 2회 이상 + 수강료 미납 + 부모 응답 없음.

권장 조치: 고위험군 7명 대상 학부모 상담 예약을 권장합니다. 이탈 예방을 위해 보강 수업 제공 및 포인트 보너스 지급을 검토하세요.`,
    insight: '보통 등록 후 6개월 시점에 이탈률이 가장 높습니다. 조기 개입이 재등록률을 35% 향상시킨다는 데이터가 있습니다.',
  },
  {
    id: 'revenue',
    icon: '📈',
    title: '매출 전망',
    badge: '7월 예측',
    summary: `현재 추세 기반 7월 예상 매출은 약 1,310만원입니다 (이번 달 대비 +2.3%).

예상 변동 요인:
- 여름방학 특강 신규 등록: +180만원 예상
- 기존 원생 휴원: -90만원 예상
- 시간 이동 조율: 영향 중립

신규 원생 타겟: 초5~중1 대상 코딩 입문반 홍보 효과가 6월 대비 40% 증가 예상.`,
    insight: '여름방학 시즌은 등록률이 높은 시기입니다. 지금 홍보 집중 투자가 적절합니다.',
  },
];

export default function AiPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set(['payment', 'attendance']));

  function generate(id: string) {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setGenerated(prev => new Set([...prev, id]));
    }, 1800);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D29]">AI 인사이트</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EAF1FF] border border-[#2F6BFF]/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-pulse" />
          <span className="text-xs font-medium text-[#2F6BFF]">Claude Sonnet 4.6</span>
        </div>
      </div>

      {/* 배너 */}
      <div className="mb-6 px-5 py-4 bg-gradient-to-r from-[#EAF1FF] to-[#E6F9EF] border border-[#2F6BFF]/20 rounded-xl">
        <p className="text-sm font-semibold text-[#1A1D29] mb-1">📌 AI가 학원 데이터를 분석합니다</p>
        <p className="text-xs text-[#6B7280]">수납, 출결, 원생 현황 데이터를 바탕으로 운영 인사이트와 액션 아이템을 자동 생성합니다. Phase 2에서 실시간 Claude API와 연동됩니다.</p>
      </div>

      <div className="space-y-4">
        <LabBenchmarkCard />
        <WithdrawAnalysisCard />
        {AI_SUMMARIES.map(item => (
          <Card key={item.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-base font-semibold text-[#1A1D29]">{item.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-[#F4F6FA] border border-[#E8EBF1] rounded-full text-[#6B7280]">{item.badge}</span>
              </div>
              {generated.has(item.id) ? (
                <span className="text-xs text-[#28C76F] font-medium">✓ 생성 완료</span>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => generate(item.id)} loading={generating === item.id}>
                  {generating === item.id ? '분석 중...' : 'AI 분석 실행'}
                </Button>
              )}
            </div>

            {generated.has(item.id) ? (
              <>
                <div className="bg-[#F4F6FA] rounded-lg p-4 mb-3">
                  <p className="text-sm text-[#1A1D29] whitespace-pre-line leading-relaxed">{item.summary}</p>
                </div>
                <div className="flex items-start gap-2 px-3 py-2.5 bg-[#E6F9EF] rounded-lg border border-[#28C76F]/15">
                  <span className="text-[#28C76F]">💡</span>
                  <p className="text-xs text-[#1A1D29]"><span className="font-semibold text-[#28C76F]">AI 인사이트: </span>{item.insight}</p>
                </div>
              </>
            ) : (
              <div className="bg-[#F4F6FA] rounded-lg p-8 text-center border border-dashed border-[#E8EBF1]">
                <p className="text-sm text-[#6B7280]">버튼을 눌러 AI 분석을 실행하세요</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
