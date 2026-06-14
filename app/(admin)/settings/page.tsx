'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { campus } from '@/lib/mock-data';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [kioskMode, setKioskMode] = useState<'phone8' | 'phone4'>('phone8');
  const [pointEnabled, setPointEnabled] = useState(true);
  const [alimtokEnabled, setAlimtokEnabled] = useState(true);
  const [autoAbsent, setAutoAbsent] = useState(true);
  const [autoAbsentMin, setAutoAbsentMin] = useState('15');

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">설정</h1>
          <p className="text-sm text-[#787774] mt-1">강남 캠퍼스 운영 설정</p>
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
            <Input label="담당자 이메일" defaultValue="gangnam@dlab.co.kr" />
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
                <Input label="카카오 비즈니스 ID" defaultValue="dlab_gangnam" />
                <Input label="발신 채널명" defaultValue="D.LAB 강남" />
              </div>
            )}
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
    </div>
  );
}
