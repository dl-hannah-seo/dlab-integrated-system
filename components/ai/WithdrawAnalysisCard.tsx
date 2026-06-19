'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { students, withdrawnStudents } from '@/lib/mock-data';
import { withdrawnOf, withdrawReasonCounts } from '@/lib/withdrawals';

// 원생관리와 동일한 데이터셋(활성 + 퇴원자)
const ALL_STUDENTS = [...students, ...withdrawnStudents];

const ACTION: Record<string, string> = {
  '비용 부담': '장학·형제 할인·분납 옵션 안내를 강화하세요.',
  '타 학원 이동': '차별화 커리큘럼·성과 사례로 재유치 상담을 진행하세요.',
  '학업 부담': '학습량 조절·맞춤 일정 상담을 제안하세요.',
  '강사·수업 불만': '담당 강사 피드백·수업 만족도 점검이 필요합니다.',
  '친구 관계': '반 배치 조정·또래 그룹 케어를 검토하세요.',
  '이사': '불가항력 사유 — 온라인/타 지점 연계를 안내하세요.',
  '기타': '개별 사유를 추가 파악해 패턴을 분류하세요.',
  '미입력': '퇴원 사유 기입률을 높여 분석 정확도를 개선하세요.',
};

export function WithdrawAnalysisCard() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const total = withdrawnOf(ALL_STUDENTS).length;
  const counts = withdrawReasonCounts(ALL_STUDENTS);
  const top = counts[0];
  const max = Math.max(1, ...counts.map(c => c.count));

  function run() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚪</span>
          <h3 className="text-base font-semibold text-[#1A1D29]">퇴원 사유 분석</h3>
          <span className="text-xs px-2 py-0.5 bg-[#F4F6FA] border border-[#E8EBF1] rounded-full text-[#6B7280]">원생관리 연동</span>
        </div>
        {generated ? (
          <span className="text-xs text-[#28C76F] font-medium">✓ 생성 완료</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={run} loading={generating}>
            {generating ? '분석 중...' : 'AI 분석 실행'}
          </Button>
        )}
      </div>

      {!generated ? (
        <div className="bg-[#F4F6FA] rounded-lg p-8 text-center border border-dashed border-[#E8EBF1]">
          <p className="text-sm text-[#6B7280]">버튼을 눌러 퇴원 사유 분석을 실행하세요</p>
        </div>
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-[#6B7280]">퇴원 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280]">누적 퇴원 <span className="text-[#1A1D29] font-medium">{total}명</span> · 사유별 분포</p>

          {/* 사유 분포 막대 */}
          <div className="space-y-2">
            {counts.map(c => (
              <div key={c.reason}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-[#1A1D29]">{c.reason}</span>
                  <span className="text-xs text-[#6B7280] tabular-nums">{c.count}명 · {Math.round((c.count / total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#EEF1F5]">
                  <div className="h-full rounded-full bg-[#F2474B]" style={{ width: `${(c.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* 인사이트 + 권장 조치 */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF]">💡 AI 인사이트 · 권장 조치</p>
            <div className="px-3 py-2.5 rounded-lg bg-[#FEE9EA] border border-[#F2474B26] text-xs leading-relaxed">
              <p className="text-[#D93539]">
                <span className="font-bold">! </span>
                최다 퇴원 사유는 <span className="font-semibold">{top.reason}</span>({top.count}명, 전체의 {Math.round((top.count / total) * 100)}%)입니다.
              </p>
              <p className="mt-1 text-[#1A1D29]">→ {ACTION[top.reason] ?? '사유 패턴을 추가 분석하세요.'}</p>
            </div>
            <p className="text-[11px] text-[#AEB4C0] mt-2">원생관리에 기입된 퇴원 사유 기반 · 데이터 축적 후 Claude API 예측으로 확장 예정</p>
          </div>
        </div>
      )}
    </Card>
  );
}
