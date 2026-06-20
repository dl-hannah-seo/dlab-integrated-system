'use client';

import { useState, useEffect, useRef } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions, SmsRecipient, SmsTemplate } from '@/components/panels/QuickActionsContext';
import { Button } from '@/components/ui/Button';
import { students } from '@/lib/mock-data';

const TEMPLATES: Record<SmsTemplate, string> = {
  absence: '[D.LAB 판교] 안녕하세요. 오늘 수업에 미도착/결석 처리되었습니다. 문의: 031-000-0000',
  unpaid: '[D.LAB 판교] 안녕하세요. 이번 달 수강료 미납 안내드립니다. 확인 부탁드립니다.',
  makeup: '[D.LAB 판교] 보강 일정 안내드립니다. 확인 부탁드립니다.',
  custom: '',
};

const TEMPLATE_LABELS: Record<SmsTemplate, string> = {
  absence: '결석 알림',
  unpaid: '미납 안내',
  makeup: '보강 안내',
  custom: '직접 입력',
};

export function SmsPanel() {
  const { activePanel, close, smsConfig } = useQuickActions();
  const open = activePanel === 'sms';

  const [recipients, setRecipients] = useState<SmsRecipient[]>([]);
  const [template, setTemplate] = useState<SmsTemplate>('custom');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && smsConfig) {
      setRecipients(smsConfig.recipients);
      setTemplate(smsConfig.template);
      setMessage(smsConfig.message ?? TEMPLATES[smsConfig.template]);
      setSent(false);
    }
    if (!open) { setSent(false); setSearch(''); }
  }, [open, smsConfig]);

  const searchResults = search.trim().length > 0
    ? students
        .filter(s =>
          !recipients.some(r => r.studentId === s.id) &&
          (s.name.includes(search) || s.parent_phone.includes(search))
        )
        .slice(0, 6)
    : [];

  function addRecipient(s: typeof students[number]) {
    setRecipients(prev => [...prev, { studentId: s.id, name: s.name, phone: s.parent_phone }]);
    setSearch('');
    searchRef.current?.focus();
  }

  function handleTemplateChange(t: SmsTemplate) {
    setTemplate(t);
    setMessage(TEMPLATES[t]);
  }

  function removeRecipient(studentId: string) {
    setRecipients(prev => prev.filter(r => r.studentId !== studentId));
  }

  function handleSend() {
    if (!message.trim() || recipients.length === 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(close, 1200);
    }, 800);
  }

  return (
    <SlidePanel open={open} onClose={close} title="문자 발송">
      <div className="px-5 py-4 space-y-5">
        {/* 수신자 */}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] mb-2">수신자</p>
          <div className="flex flex-wrap gap-1.5 p-3 bg-[#F4F6FA] rounded-lg min-h-[48px]">
            {recipients.length === 0 && search.trim() === '' && (
              <span className="text-xs text-[#AEB4C0]">아래에서 학생을 검색해 추가하세요</span>
            )}
            {recipients.map(r => (
              <span
                key={r.studentId}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E8EBF1] rounded-full text-xs text-[#1A1D29]"
              >
                {r.name} 부모님
                <button
                  onClick={() => removeRecipient(r.studentId)}
                  className="text-[#6B7280] hover:text-[#F2474B] ml-0.5 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          {/* 학생 검색 */}
          <div className="relative mt-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="학생 이름 또는 연락처 검색"
              className="w-full px-3 py-2 text-sm text-[#1A1D29] bg-white border border-[#E8EBF1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F6BFF] focus:border-[#2F6BFF]"
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-[#E8EBF1] rounded-lg shadow-lg overflow-hidden">
                {searchResults.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => addRecipient(s)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#F4F6FA] transition-colors text-left"
                    >
                      <span className="font-medium text-[#1A1D29]">{s.name}</span>
                      <span className="text-xs text-[#6B7280]">{s.parent_phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.trim().length > 0 && searchResults.length === 0 && (
              <p className="mt-1.5 text-xs text-[#AEB4C0] px-1">검색 결과가 없습니다</p>
            )}
          </div>
        </div>

        {/* 템플릿 */}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] mb-2">템플릿</p>
          <div className="flex gap-2">
            {(['absence', 'unpaid', 'makeup', 'custom'] as SmsTemplate[]).map(t => (
              <button
                key={t}
                onClick={() => handleTemplateChange(t)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  template === t
                    ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                    : 'bg-white text-[#6B7280] border-[#E8EBF1] hover:border-[#2F6BFF]/50'
                }`}
              >
                {TEMPLATE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] mb-2">메시지</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 90))}
            rows={4}
            placeholder="메시지를 입력하세요"
            className="w-full px-3 py-2.5 text-sm text-[#1A1D29] bg-white border border-[#E8EBF1] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#2F6BFF] focus:border-[#2F6BFF]"
          />
          <p className={`text-right text-xs mt-1 ${message.length >= 85 ? 'text-[#F2474B]' : 'text-[#6B7280]'}`}>
            {message.length} / 90자
          </p>
        </div>

        {/* 발송 */}
        {sent ? (
          <div className="text-center py-3 bg-[#E6F9EF] rounded-lg text-sm font-semibold text-[#28C76F]">
            ✓ 발송 완료
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSend}
            loading={sending}
            disabled={recipients.length === 0 || !message.trim()}
          >
            {recipients.length > 0 ? `${recipients.length}명에게 발송` : '발송하기'}
          </Button>
        )}
      </div>
    </SlidePanel>
  );
}
