'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { campus } from '@/lib/mock-data';

interface MsgTemplate { id: string; name: string; trigger: string; body: string; }

const TRIGGER_OPTIONS = [
  { value: '단체', label: '단체 안내' },
  { value: '결제', label: '결제 URL' },
  { value: '결석', label: '결석 확인' },
  { value: '보강', label: '보강 안내' },
  { value: '등원', label: '등원 알림' },
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [kioskMode, setKioskMode] = useState<'phone8' | 'phone4'>('phone8');
  const [pointEnabled, setPointEnabled] = useState(true);
  const [alimtokEnabled, setAlimtokEnabled] = useState(true);
  const [autoAbsent, setAutoAbsent] = useState(true);
  const [autoAbsentMin, setAutoAbsentMin] = useState('15');

  // 메시지 템플릿 관리
  const [templates, setTemplates] = useState<MsgTemplate[]>([
    { id: 't1', name: '단체 안내', trigger: '단체', body: '[D.LAB 판교] {원생명} 학부모님, 안녕하세요.\n본원 관련 안내 말씀 드립니다.' },
    { id: 't2', name: '결제 URL 안내', trigger: '결제', body: '[D.LAB 판교] {원생명} 학부모님,\n수강료 결제 안내입니다.\n결제 링크: https://pay.dlab.co.kr/pangyo' },
    { id: 't3', name: '결석 확인', trigger: '결석', body: '[D.LAB 판교] {원생명} 학부모님,\n오늘 수업에 결석하여 안내드립니다.' },
  ]);
  const [editingTpl, setEditingTpl] = useState<MsgTemplate | null>(null);
  const [isNewTpl, setIsNewTpl] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplTrigger, setTplTrigger] = useState('단체');
  const [tplBody, setTplBody] = useState('');

  function openNewTpl() {
    setIsNewTpl(true); setTplName(''); setTplTrigger('단체'); setTplBody('[D.LAB 판교] {원생명} 학부모님,\n');
    setEditingTpl({ id: '', name: '', trigger: '단체', body: '' });
  }
  function openEditTpl(t: MsgTemplate) {
    setIsNewTpl(false); setTplName(t.name); setTplTrigger(t.trigger); setTplBody(t.body);
    setEditingTpl(t);
  }
  function saveTpl() {
    if (!tplName.trim()) return;
    if (isNewTpl) {
      setTemplates(p => [...p, { id: `t-${Date.now()}`, name: tplName, trigger: tplTrigger, body: tplBody }]);
    } else if (editingTpl) {
      setTemplates(p => p.map(t => (t.id === editingTpl.id ? { ...t, name: tplName, trigger: tplTrigger, body: tplBody } : t)));
    }
    setEditingTpl(null);
  }
  function deleteTpl(id: string) {
    setTemplates(p => p.filter(t => t.id !== id));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">설정</h1>
          <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 운영 설정</p>
        </div>
        <Button onClick={handleSave} loading={saved}>{saved ? '저장 완료!' : '변경사항 저장'}</Button>
      </div>

      <div className="space-y-5">
        {/* 캠퍼스 기본 정보 */}
        <Card title="캠퍼스 정보">
          <div className="grid grid-cols-2 gap-4">
            <Input label="캠퍼스명" defaultValue={campus.name} />
            <Input label="결제 링크 URL" defaultValue={campus.payment_link_url} />
            <Input label="대표 전화" defaultValue="02-000-0000" />
            <Input label="담당자 이메일" defaultValue="pangyo@dlab.co.kr" />
          </div>
        </Card>

        {/* 키오스크 설정 */}
        <Card title="키오스크 설정">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-2">인증 방식</label>
              <div className="flex gap-3">
                {[
                  { value: 'phone8', label: '전화번호 뒤 8자리' },
                  { value: 'phone4', label: '전화번호 뒤 4자리' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${kioskMode === opt.value ? 'border-[#FF6C37] bg-[#FFF1EC]' : 'border-[#E9E9E7] bg-white'}`}>
                    <input type="radio" name="kioskMode" value={opt.value} checked={kioskMode === opt.value}
                      onChange={() => setKioskMode(opt.value as 'phone8' | 'phone4')} className="accent-[#FF6C37]" />
                    <span className="text-sm text-[#37352F]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#E9E9E7]">
              <div>
                <p className="text-sm font-medium text-[#37352F]">포인트 시스템 활성화</p>
                <p className="text-xs text-[#787774]">체크인 시 DP 포인트 적립 및 칭호 기능</p>
              </div>
              <button onClick={() => setPointEnabled(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${pointEnabled ? 'bg-[#FF6C37]' : 'bg-[#E9E9E7]'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${pointEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* 출결 설정 */}
        <Card title="출결 자동화">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#E9E9E7]">
              <div>
                <p className="text-sm font-medium text-[#37352F]">결석 자동 전환</p>
                <p className="text-xs text-[#787774]">수업 시작 후 일정 시간이 지나면 미도착자를 결석 처리</p>
              </div>
              <button onClick={() => setAutoAbsent(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoAbsent ? 'bg-[#FF6C37]' : 'bg-[#E9E9E7]'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoAbsent ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {autoAbsent && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#37352F]">수업 시작 후</span>
                <Input type="number" value={autoAbsentMin} onChange={e => setAutoAbsentMin(e.target.value)} className="w-20" />
                <span className="text-sm text-[#37352F]">분 후 자동 결석 처리</span>
              </div>
            )}
          </div>
        </Card>

        {/* 알림톡 설정 */}
        <Card title="알림톡 (카카오)">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#E9E9E7]">
              <div>
                <p className="text-sm font-medium text-[#37352F]">알림톡 발송 활성화</p>
                <p className="text-xs text-[#787774]">결석 처리, 보강 확정, 수납 안내 알림톡</p>
              </div>
              <button onClick={() => setAlimtokEnabled(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${alimtokEnabled ? 'bg-[#FF6C37]' : 'bg-[#E9E9E7]'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alimtokEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {alimtokEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="카카오 비즈니스 ID" defaultValue="dlab_pangyo" />
                <Input label="발신 채널명" defaultValue="D.LAB 판교" />
              </div>
            )}
          </div>
        </Card>

        {/* 메시지 템플릿 */}
        <Card
          title="메시지 템플릿"
          action={<Button size="sm" onClick={openNewTpl}>+ 새 템플릿</Button>}
        >
          <p className="text-xs text-[#787774] mb-3">문자/알림톡 발송 화면(원생 관리·창구수납·시간표 등)에서 선택하는 템플릿입니다. {'{'}원생명{'}'} 등 변수는 발송 시 자동 치환됩니다.</p>
          <div className="space-y-2">
            {templates.length === 0 && <p className="text-sm text-[#787774]">등록된 템플릿이 없습니다.</p>}
            {templates.map(t => (
              <div key={t.id} className="border border-[#E9E9E7] rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#37352F]">{t.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium badge-submitted">{t.trigger}</span>
                    </div>
                    <p className="text-xs text-[#787774] mt-1 whitespace-pre-line line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => openEditTpl(t)} className="text-sm text-[#37352F] hover:underline">편집</button>
                    <DeleteButton onClick={() => deleteTpl(t.id)}>삭제</DeleteButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 담당자 */}
        <Card title="담당자 계정">
          <div className="grid grid-cols-2 gap-4">
            <Input label="이름" defaultValue="데스크 담당자" />
            <Select label="역할" options={[{value:'staff',label:'스태프'},{value:'admin',label:'관리자'}]} />
            <Input label="이메일" defaultValue="hjseo@daddyslab.com" />
            <Input label="전화번호" defaultValue="010-0000-0000" />
          </div>
          <div className="mt-4 pt-4 border-t border-[#E9E9E7]">
            <Button variant="secondary" size="sm">비밀번호 변경</Button>
          </div>
        </Card>
      </div>

      {/* 템플릿 추가/편집 모달 */}
      {editingTpl && (
        <Modal
          open={editingTpl !== null}
          onClose={() => setEditingTpl(null)}
          title={isNewTpl ? '새 메시지 템플릿' : '메시지 템플릿 편집'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingTpl(null)}>취소</Button>
              <Button onClick={saveTpl} disabled={!tplName.trim()}>저장</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="템플릿 이름" value={tplName} onChange={e => setTplName(e.target.value)} placeholder="예: 보강 안내" />
              <Select label="발송 트리거" value={tplTrigger} onChange={e => setTplTrigger(e.target.value)} options={TRIGGER_OPTIONS} />
            </div>
            <div>
              <Textarea label="메시지 내용" rows={6} value={tplBody} onChange={e => setTplBody(e.target.value)} />
              <p className="text-xs text-[#787774] mt-1">{'{'}원생명{'}'} {'{'}등원시간{'}'} {'{'}보강일시{'}'} 등 변수는 발송 시 자동 치환됩니다.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#787774] mb-1.5">미리보기</p>
              <div className="bg-[#FEF6E0] border border-[#E9E9E7] rounded-xl px-4 py-3 max-w-[320px]">
                <p className="text-[11px] text-[#787774] mb-1.5">카카오 알림톡</p>
                <p className="text-sm text-[#37352F] whitespace-pre-line leading-relaxed">{tplBody.split('{원생명}').join('홍길동')}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
