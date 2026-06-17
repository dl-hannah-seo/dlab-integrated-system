import { classes } from '@/lib/mock-data';
import { computeRevenue, fmt, ROYALTY_RATE } from '@/lib/revenue';
import { Card } from '@/components/ui/Card';

const ROYALTY_PCT = Math.round(ROYALTY_RATE * 100);

export default function RevenuePage() {
  const r = computeRevenue(classes);

  const kpis = [
    { label: '교육 매출', value: r.eduRevenue, note: '판교 캠퍼스 · 재원 반 수강료' },
    { label: `로열티 (${ROYALTY_PCT}%)`, value: r.royalty, note: `교육 매출의 ${ROYALTY_PCT}% · 본사 납부`, accent: true },
    { label: '콘텐츠 사용료', value: r.contentTotal, note: `${r.contentRows.length}개 콘텐츠 · 본사 납부`, accent: true },
    { label: '본사 납부 합계', value: r.hqTotal, note: '로열티 + 콘텐츠', accent: true },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">재무 현황</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 본사 정산 현황</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E9E9E7] rounded-lg p-5">
            <p className="text-sm text-[#787774]">{k.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${k.accent ? 'text-[#EB5757]' : 'text-[#37352F]'}`}>
              {fmt(k.value)}
            </p>
            <p className="mt-2 text-xs text-[#787774]">{k.note}</p>
          </div>
        ))}
      </div>

      {/* 본사 정산 내역 */}
      <Card
        title="본사 정산 내역"
        className="mb-6"
        action={
          <span className="inline-flex items-center rounded-md bg-[#FCEBEA] px-2.5 py-1 text-sm font-semibold text-[#EB5757] tabular-nums">
            합계 {fmt(r.hqTotal)}
          </span>
        }
      >
        <p className="-mt-2 mb-4 text-sm text-[#787774]">
          로열티와 콘텐츠 사용료는 별개 항목으로 본사에 납부합니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7]">
                <th className="px-4 py-3 text-left font-semibold text-[#37352F]">항목</th>
                <th className="px-4 py-3 text-left font-semibold text-[#37352F]">기준</th>
                <th className="px-4 py-3 text-right font-semibold text-[#37352F]">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E9E9E7]">
                <td className="px-4 py-3 text-[#37352F]">가맹 로열티</td>
                <td className="px-4 py-3 text-[#787774]">교육 매출 {fmt(r.eduRevenue)} × {ROYALTY_PCT}%</td>
                <td className="px-4 py-3 text-right font-medium text-[#EB5757] tabular-nums">{fmt(r.royalty)}</td>
              </tr>
              <tr className="border-b border-[#E9E9E7]">
                <td className="px-4 py-3 text-[#37352F]">콘텐츠 사용료</td>
                <td className="px-4 py-3 text-[#787774]">{r.contentRows.length}개 콘텐츠 · 사용 학생 수 × 1인 단가</td>
                <td className="px-4 py-3 text-right font-medium text-[#EB5757] tabular-nums">{fmt(r.contentTotal)}</td>
              </tr>
              <tr className="bg-[#FAFAF9]">
                <td className="px-4 py-3 font-semibold text-[#37352F]" colSpan={2}>본사 납부 합계</td>
                <td className="px-4 py-3 text-right text-base font-bold text-[#EB5757] tabular-nums">{fmt(r.hqTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 콘텐츠 사용료 청구 상세 */}
      <Card
        title="콘텐츠 사용료 청구 상세"
        action={
          <span className="inline-flex items-center rounded-md bg-[#FCEBEA] px-2.5 py-1 text-sm font-semibold text-[#EB5757] tabular-nums">
            합계 {fmt(r.contentTotal)}
          </span>
        }
      >
        <p className="-mt-2 mb-4 text-sm text-[#787774]">
          우리 캠퍼스 학생이 사용한 콘텐츠 = 사용 학생 수 × 1인 단가
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7]">
                <th className="px-4 py-3 text-left font-semibold text-[#37352F]">콘텐츠</th>
                <th className="px-4 py-3 text-right font-semibold text-[#37352F]">사용 학생</th>
                <th className="px-4 py-3 text-right font-semibold text-[#37352F]">1인 단가</th>
                <th className="px-4 py-3 text-right font-semibold text-[#37352F]">청구액</th>
              </tr>
            </thead>
            <tbody>
              {r.contentRows.map((row) => (
                <tr key={row.content} className="border-b border-[#E9E9E7]">
                  <td className="px-4 py-3 text-[#37352F]">{row.content}</td>
                  <td className="px-4 py-3 text-right text-[#37352F] tabular-nums">{row.students}명</td>
                  <td className="px-4 py-3 text-right text-[#37352F] tabular-nums">{fmt(row.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#37352F] tabular-nums">{fmt(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-[#FAFAF9]">
                <td className="px-4 py-3 font-semibold text-[#37352F]" colSpan={3}>합계</td>
                <td className="px-4 py-3 text-right text-base font-bold text-[#EB5757] tabular-nums">{fmt(r.contentTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
