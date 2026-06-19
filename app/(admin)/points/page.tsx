'use client';

import { useState, useMemo } from 'react';
import {
  students, classes, pointPresets, POINT_CATEGORIES, kioskShopItems as shopSeed,
  type PointPreset, type Student, type KioskShopItem,
} from '@/lib/mock-data';
import { useRole } from '@/components/layout/RoleContext';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME, canGivePoints, canManageShop } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { Card } from '@/components/ui/Card';
import { Input, MoneyInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DeleteButton } from '@/components/ui/DeleteButton';

type Tab = 'give' | 'shop';
interface Grant { id: string; studentName: string; label: string; points: number; }
let grantSeq = 0;
let itemSeq = 0;

export default function PointsPage() {
  const { role } = useRole();
  const showGive = canGivePoints(role);
  const showShop = canManageShop(role);
  const [tab, setTab] = useState<Tab>(showGive ? 'give' : 'shop');

  // ── 포인트 지급 ──
  const targetStudents = useMemo<Student[]>(() => {
    if (role === '교사') {
      const ids = new Set(classesOfTeacher(DEMO_TEACHER_ID, classes).map(c => c.id));
      return students.filter(s => s.status === '재원' && ids.has(s.class_id));
    }
    return students.filter(s => s.status === '재원');
  }, [role]);
  const [studentId, setStudentId] = useState(targetStudents[0]?.id ?? '');
  const [studentSearch, setStudentSearch] = useState(targetStudents[0]?.name ?? '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const student = targetStudents.find(s => s.id === studentId) ?? targetStudents[0];

  const courseOf = (s: Student) => classes.find(x => x.id === s.class_id)?.course ?? '';
  const studentMatches = useMemo(() => {
    const q = studentSearch.trim();
    const base = q ? targetStudents.filter(s => s.name.includes(q) || courseOf(s).includes(q)) : targetStudents;
    return base.slice(0, 8);
  }, [studentSearch, targetStudents]);

  // ── 상점 상품 관리 ──
  const [items, setItems] = useState<KioskShopItem[]>(shopSeed);
  const [form, setForm] = useState({ icon: '🎁', name: '', cost: '' });

  const [toast, setToast] = useState('');
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 1800); }

  function give(preset: PointPreset) {
    if (!student) return;
    grantSeq += 1;
    setGrants(prev => [{ id: `g-${grantSeq}`, studentName: student.name, label: preset.label, points: preset.points }, ...prev]);
    showToast(`${student.name} · ${preset.label} +${preset.points}P 지급`);
  }
  function updateItem(id: string, patch: Partial<KioskShopItem>) { setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it))); }
  function removeItem(id: string) { setItems(prev => prev.filter(it => it.id !== id)); }
  function addItem() {
    const cost = parseInt(form.cost, 10);
    if (!form.name.trim() || !Number.isFinite(cost)) return;
    itemSeq += 1;
    setItems(prev => [...prev, { id: `ks-new-${itemSeq}`, icon: form.icon || '🎁', name: form.name.trim(), cost: Math.max(0, cost) }]);
    setForm({ icon: '🎁', name: '', cost: '' });
  }

  const bothTabs = showGive && showShop;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1D29]">포인트 관리</h1>
      </div>

      {/* 탭 (둘 다 권한 있을 때만) */}
      {bothTabs && (
        <div className="inline-flex rounded-lg border border-[#E8EBF1] bg-white p-0.5 mb-5">
          {([['give', '포인트 지급'], ['shop', '상점 상품 관리']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === t ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── 포인트 지급 ── */}
      {showGive && (!bothTabs || tab === 'give') && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card title="포인트 지급" action={role === '교사' ? <span className="text-xs text-[#6B7280]">{DEMO_TEACHER_NAME} 선생님 담당 반</span> : undefined}>
            <div className="mb-4 max-w-xs relative">
              <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">학생 선택</label>
              <input
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                placeholder="학생 이름·과정 검색"
                className="w-full border border-[#E8EBF1] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2F6BFF]"
              />
              {searchOpen && (
                <div className="absolute z-20 mt-1 w-full border border-[#E8EBF1] rounded-md bg-white shadow-lg divide-y divide-[#EEF1F5] max-h-60 overflow-y-auto">
                  {studentMatches.map(s => (
                    <button key={s.id} type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setStudentId(s.id); setStudentSearch(s.name); setSearchOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#F4F6FA] ${s.id === studentId ? 'bg-[#EAF1FF]' : ''}`}>
                      <span className="text-sm text-[#1A1D29]">{s.name}</span>
                      <span className="text-xs text-[#6B7280]">{courseOf(s)}</span>
                    </button>
                  ))}
                  {studentMatches.length === 0 && <p className="px-3 py-2 text-xs text-[#6B7280]">검색 결과가 없습니다.</p>}
                </div>
              )}
              {student && (
                <p className="mt-1.5 text-xs text-[#6B7280]">지급 대상: <span className="font-medium text-[#1A1D29]">{student.name}</span></p>
              )}
            </div>
            {POINT_CATEGORIES.map(cat => {
              const list = pointPresets.filter(p => p.category === cat);
              if (list.length === 0) return null;
              return (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-[#6B7280] mb-1.5">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map(p => (
                      <button key={p.id} onClick={() => give(p)} disabled={!student}
                        className="px-3 py-2 rounded-lg border border-[#E8EBF1] bg-white text-sm text-[#1A1D29] hover:border-[#2F6BFF] hover:bg-[#EAF1FF] transition-colors disabled:opacity-40">
                        {p.label} <span className="font-bold text-[#2F6BFF]">+{p.points}P</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
          <Card title="오늘 지급 내역">
            {grants.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B7280]">지급한 포인트가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-[#EEF1F5] -my-1">
                {grants.map(g => (
                  <li key={g.id} className="flex items-center justify-between py-2.5">
                    <div><span className="text-sm text-[#1A1D29]">{g.studentName}</span><span className="text-xs text-[#6B7280] ml-2">{g.label}</span></div>
                    <span className="text-sm font-bold text-[#28C76F] tabular-nums">+{g.points}P</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ── 상점 상품 관리 ── */}
      {showShop && (!bothTabs || tab === 'shop') && (
        <>
          <Card title={`상점 상품 ${items.length}개`} className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F6FA] border-b border-[#E8EBF1] text-left text-[#1A1D29]">
                    <th className="px-3 py-2.5 font-semibold w-16">아이콘</th>
                    <th className="px-3 py-2.5 font-semibold">상품명</th>
                    <th className="px-3 py-2.5 font-semibold w-40 text-right">가격(P)</th>
                    <th className="px-3 py-2.5 font-semibold w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b border-[#EEF1F5]">
                      <td className="px-3 py-2"><input value={it.icon} onChange={e => updateItem(it.id, { icon: e.target.value })} className="w-12 text-center text-lg bg-white border border-[#E8EBF1] rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]" /></td>
                      <td className="px-3 py-2"><input value={it.name} onChange={e => updateItem(it.id, { name: e.target.value })} className="w-full text-sm text-[#1A1D29] bg-white border border-[#E8EBF1] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]" /></td>
                      <td className="px-3 py-2 text-right"><input inputMode="numeric" value={it.cost ? it.cost.toLocaleString('ko-KR') : ''} onChange={e => updateItem(it.id, { cost: Math.max(0, Number(e.target.value.replace(/[^0-9]/g, '')) || 0) })} className="w-28 text-right text-sm tabular-nums bg-white border border-[#E8EBF1] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]" /></td>
                      <td className="px-3 py-2 text-right"><DeleteButton onClick={() => removeItem(it.id)}>삭제</DeleteButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="상품 추가">
            <div className="grid gap-2 sm:grid-cols-[80px_1fr_160px_auto] items-end">
              <Input label="아이콘" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
              <Input label="상품명" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 문화상품권" />
              <MoneyInput label="가격(P)" value={form.cost ? Number(form.cost) : 0} onValueChange={n => setForm({ ...form, cost: n ? String(n) : '' })} placeholder="500" />
              <Button onClick={addItem} disabled={!form.name.trim() || !form.cost}>추가</Button>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-3">데모: 변경은 이 화면 세션에 저장됩니다.</p>
          </Card>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1D29] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>
      )}
    </div>
  );
}
