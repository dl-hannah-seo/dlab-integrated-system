'use client';

import { useState } from 'react';
import {
  LEAD_STAGES, LEAD_SOURCES, LEAD_SUBJECTS, LEAD_WEEK_START,
  type LeadStage,
} from '@/lib/mock-data';
import { leadStageCounts, conversionRate, activeLeads, newThisWeek } from '@/lib/leads';
import { useLeads } from '@/components/panels/LeadsContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const STAGE_STYLE: Record<LeadStage, string> = {
  '신규문의': 'bg-[#F1F1EF] text-[#787774]',
  '상담예약': 'bg-[#E8F0FE] text-[#1A73E8]',
  '상담완료': 'bg-[#FFF1EC] text-[#FF6C37]',
  '등록': 'bg-[#EDF7F5] text-[#0F7B6C]',
  '미등록': 'bg-[#FDECEA] text-[#EB5757]',
};

export default function LeadsPage() {
  const { leads, addLead, updateStage } = useLeads();
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', subject: LEAD_SUBJECTS[0], source: LEAD_SOURCES[0], grade: '', memo: '' });

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 2000); }

  const counts = leadStageCounts(leads);
  const kpis = [
    { label: '이번 주 신규 문의', value: `${newThisWeek(leads, LEAD_WEEK_START)}건` },
    { label: '상담 진행중', value: `${activeLeads(leads).length}명` },
    { label: '등록 전환율', value: `${conversionRate(leads)}%`, tone: 'good' as const },
    { label: '미등록', value: `${counts['미등록']}명`, tone: 'danger' as const },
  ];

  function setStage(id: string, stage: LeadStage) {
    updateStage(id, stage);
  }
  function convert(id: string) {
    updateStage(id, '등록');
    const l = leads.find(x => x.id === id);
    showToast(`${l?.name ?? ''} 등록 처리되었습니다.`);
  }
  function submitLead() {
    if (!form.name.trim()) return;
    addLead({ name: form.name, parent_phone: '010-1234-5678', grade: form.grade, source: form.source, interest_subject: form.subject, stage: '신규문의', memo: form.memo });
    setForm({ name: '', subject: LEAD_SUBJECTS[0], source: LEAD_SOURCES[0], grade: '', memo: '' });
    showToast('신규 문의가 추가되었습니다.');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">상담 관리</h1>
        <p className="text-sm text-[#787774] mt-1">예비 원생(문의·상담) 파이프라인 · 문의 → 상담 → 등록/미등록</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-[#E9E9E7] rounded-lg p-4">
            <p className="text-xs text-[#787774]">{k.label}</p>
            <p className={`mt-1.5 text-xl font-bold tabular-nums ${
              k.tone === 'good' ? 'text-[#0F7B6C]' : k.tone === 'danger' ? 'text-[#EB5757]' : 'text-[#37352F]'
            }`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* 단계별 현황 */}
      <Card title="단계별 현황" className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {LEAD_STAGES.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${STAGE_STYLE[s]}`}>
                {s} <span className="tabular-nums font-bold">{counts[s]}</span>
              </span>
              {i < LEAD_STAGES.length - 1 && <span className="text-[#BEBDBA]">›</span>}
            </span>
          ))}
        </div>
      </Card>

      {/* 신규 문의 추가 */}
      <Card title="신규 문의 추가" className="mb-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <Input label="이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="학생 이름" />
          <Input label="학년" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="예: 초4" />
          <Select label="관심 과목" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={LEAD_SUBJECTS.map(v => ({ value: v, label: v }))} />
          <Select label="유입경로" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} options={LEAD_SOURCES.map(v => ({ value: v, label: v }))} />
          <Input label="메모" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="선택" />
          <Button onClick={submitLead} disabled={!form.name.trim()}>추가</Button>
        </div>
      </Card>

      {/* 리드 목록 */}
      <Card title={`예비 원생 ${leads.length}명`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7] text-left text-[#37352F]">
                <th className="px-3 py-2.5 font-semibold">이름</th>
                <th className="px-3 py-2.5 font-semibold">연락처</th>
                <th className="px-3 py-2.5 font-semibold">관심 과목</th>
                <th className="px-3 py-2.5 font-semibold">유입경로</th>
                <th className="px-3 py-2.5 font-semibold">문의일</th>
                <th className="px-3 py-2.5 font-semibold">다음 연락</th>
                <th className="px-3 py-2.5 font-semibold">단계</th>
                <th className="px-3 py-2.5 font-semibold text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-b border-[#F1F0EF]">
                  <td className="px-3 py-2.5 text-[#37352F]">
                    {l.name}{l.grade ? <span className="text-xs text-[#9B9A97] ml-1">{l.grade}</span> : ''}
                    {l.memo && <p className="text-[11px] text-[#9B9A97] mt-0.5">{l.memo}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <a href={`tel:${l.parent_phone.replace(/[^0-9]/g, '')}`} className="text-[#FF6C37] hover:underline">📞 {l.parent_phone}</a>
                  </td>
                  <td className="px-3 py-2.5 text-[#37352F]">{l.interest_subject}</td>
                  <td className="px-3 py-2.5 text-[#787774]">{l.source}</td>
                  <td className="px-3 py-2.5 text-[#787774] tabular-nums">{l.inquiry_date.slice(5)}</td>
                  <td className="px-3 py-2.5 text-[#787774] tabular-nums">{l.next_contact_date ? l.next_contact_date.slice(5) : '-'}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={l.stage}
                      onChange={e => setStage(l.id, e.target.value as LeadStage)}
                      className={`text-xs font-medium rounded-md px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#FF6C37] ${STAGE_STYLE[l.stage]}`}
                    >
                      {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {l.stage !== '등록' && l.stage !== '미등록' && (
                      <button onClick={() => convert(l.id)} className="text-xs px-2.5 py-1 rounded-md border border-[#0F7B6C]/30 text-[#0F7B6C] hover:bg-[#0F7B6C]/10 transition-colors">등록 전환</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#37352F] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
