'use client';

import { Fragment, useState } from 'react';
import { TODAY } from '@/lib/mock-data';
import { useLeads } from '@/components/panels/LeadsContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MoneyInput, Select } from '@/components/ui/Input';
import {
  PROMO_CHANNELS,
  CHANNEL_LABELS,
  currentQuarter,
  quarterLabel,
  promoSum,
  usePromoStore,
  saveQuarter,
  getQuarter,
  quarterRows,
  rate,
  type PromoChannel,
  type PromoQuarter,
} from '@/lib/promotion';

const DETAIL_QUARTERS = 5;

export default function PromotionPage() {
  const { leads } = useLeads();
  const cur = currentQuarter(TODAY);
  const store = usePromoStore();

  const rows = quarterRows(leads, store, TODAY, DETAIL_QUARTERS);

  // 입력/수정 대상 분기 (기본: 현재 분기). draft가 있으면 수정 모드.
  const [selected, setSelected] = useState(cur);
  const [draft, setDraft] = useState<PromoQuarter | null>(null);
  const editing = draft !== null;

  const saved = getQuarter(store, selected, TODAY);
  const view = draft ?? saved;
  const total = promoSum(view);

  function changeQuarter(key: string) {
    setSelected(key);
    setDraft(null); // 분기 바꾸면 수정 취소
  }
  function startEdit() {
    setDraft({ ...saved });
  }
  function cancelEdit() {
    setDraft(null);
  }
  function save() {
    if (draft) saveQuarter(selected, draft);
    setDraft(null);
  }
  function updateDraft(ch: PromoChannel, n: number) {
    setDraft(d => ({ ...(d ?? saved), [ch]: n }));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1D29]">홍보 지표 입력</h1>
      </div>

      {/* 분기별 채널 입력/수정 */}
      <Card
        title="채널별 홍보 건수 입력"
        className="mb-6"
        action={
          <Select
            value={selected}
            onChange={e => changeQuarter(e.target.value)}
            className="w-36"
            options={rows.map(r => ({ value: r.key, label: quarterLabel(r.key) }))}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PROMO_CHANNELS.map(ch => (
            <MoneyInput
              key={ch}
              label={CHANNEL_LABELS[ch]}
              value={view[ch]}
              onValueChange={n => updateDraft(ch, n)}
              disabled={!editing}
              suffix="건"
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#1A1D29]">
            합계 <span className="font-bold tabular-nums">{total.toLocaleString('ko-KR')}</span>건
          </p>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>취소</Button>
              <Button variant="primary" size="sm" onClick={save}>저장</Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={startEdit}>
              수정
            </Button>
          )}
        </div>
      </Card>

      {/* 최신순 5개 분기 — 분기별 퍼널 보드 */}
      <Card title="분기별 추이" action={<span className="text-xs text-[#9CA3AF]">최신순 {DETAIL_QUARTERS}개 분기</span>}>
        <div className="space-y-3">
          {rows.map(r => {
            const withdraw = Math.round((r.enroll * r.withdrawRate) / 100);
            const steps = [
              { label: '홍보', value: r.promoTotal, tone: 'bg-[#EAF1FF] text-[#2F6BFF]' },  // Primary
              { label: '상담', value: r.consult,    tone: 'bg-[#EEF1F5] text-[#4B5563]' },  // Gray
              { label: '등록', value: r.enroll,     tone: 'bg-[#E6F9EF] text-[#1FA85C]' },  // Green
              { label: '퇴원', value: withdraw,     tone: 'bg-[#FEE9EA] text-[#F2474B]' },  // Secondary
            ];
            return (
              <div key={r.key} className="flex items-center gap-3 border-b border-[#EEF1F5] pb-3 last:border-0 last:pb-0">
                <div className="w-24 shrink-0">
                  <p className="text-sm font-medium text-[#1A1D29]">{quarterLabel(r.key)}</p>
                  {r.key === cur && <span className="mt-0.5 inline-block rounded bg-[#EAF1FF] px-1.5 py-0.5 text-[10px] text-[#2F6BFF]">현재</span>}
                </div>
                <div className="flex flex-1 items-stretch gap-1.5">
                  {steps.map((b, i, arr) => (
                    <Fragment key={b.label}>
                      <div className={`flex-1 basis-0 min-w-0 rounded-lg px-3 py-2 text-center ${b.tone}`}>
                        <p className="text-[11px]">{b.label}</p>
                        <p className="mt-0.5 text-xl font-bold tabular-nums">{b.value.toLocaleString('ko-KR')}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex shrink-0 flex-col items-center justify-center px-1">
                          <span className="text-base leading-none text-[#C7CDD6]">›</span>
                          <span className="mt-1 rounded-full bg-[#EAF1FF] px-2 py-0.5 text-xs font-bold tabular-nums text-[#2F6BFF]">{rate(arr[i + 1].value, b.value)}%</span>
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
