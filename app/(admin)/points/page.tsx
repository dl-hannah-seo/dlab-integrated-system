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
import { Select, Input } from '@/components/ui/Input';
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
  const [grants, setGrants] = useState<Grant[]>([]);
  const student = targetStudents.find(s => s.id === studentId) ?? targetStudents[0];

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
        <h1 className="text-xl font-bold text-[#37352F]">포인트 관리</h1>
        <p className="text-sm text-[#787774] mt-1">학생 포인트 지급과 상점 상품을 관리합니다.</p>
      </div>

      {/* 탭 (둘 다 권한 있을 때만) */}
      {bothTabs && (
        <div className="inline-flex rounded-lg border border-[#E9E9E7] bg-white p-0.5 mb-5">
          {([['give', '포인트 지급'], ['shop', '상점 상품 관리']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                tab === t ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium' : 'text-[#787774] hover:text-[#37352F]'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── 포인트 지급 ── */}
      {showGive && (!bothTabs || tab === 'give') && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card title="포인트 지급" action={role === '교사' ? <span className="text-xs text-[#787774]">{DEMO_TEACHER_NAME} 선생님 담당 반</span> : undefined}>
            <div className="mb-4 max-w-xs">
              <Select label="학생 선택" value={studentId} onChange={e => setStudentId(e.target.value)}
                options={targetStudents.map(s => {
                  const c = classes.find(x => x.id === s.class_id);
                  return { value: s.id, label: `${s.name} · ${c?.course ?? ''}` };
                })} />
            </div>
            {POINT_CATEGORIES.map(cat => {
              const list = pointPresets.filter(p => p.category === cat);
              if (list.length === 0) return null;
              return (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-[#787774] mb-1.5">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map(p => (
                      <button key={p.id} onClick={() => give(p)} disabled={!student}
                        className="px-3 py-2 rounded-lg border border-[#E9E9E7] bg-white text-sm text-[#37352F] hover:border-[#FF6C37] hover:bg-[#FFF8F5] transition-colors disabled:opacity-40">
                        {p.label} <span className="font-bold text-[#FF6C37]">+{p.points}P</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
          <Card title="오늘 지급 내역">
            {grants.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#787774]">지급한 포인트가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-[#F1F0EF] -my-1">
                {grants.map(g => (
                  <li key={g.id} className="flex items-center justify-between py-2.5">
                    <div><span className="text-sm text-[#37352F]">{g.studentName}</span><span className="text-xs text-[#787774] ml-2">{g.label}</span></div>
                    <span className="text-sm font-bold text-[#0F7B6C] tabular-nums">+{g.points}P</span>
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
                  <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7] text-left text-[#37352F]">
                    <th className="px-3 py-2.5 font-semibold w-16">아이콘</th>
                    <th className="px-3 py-2.5 font-semibold">상품명</th>
                    <th className="px-3 py-2.5 font-semibold w-40 text-right">가격(P)</th>
                    <th className="px-3 py-2.5 font-semibold w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b border-[#F1F0EF]">
                      <td className="px-3 py-2"><input value={it.icon} onChange={e => updateItem(it.id, { icon: e.target.value })} className="w-12 text-center text-lg bg-white border border-[#E9E9E7] rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF6C37]" /></td>
                      <td className="px-3 py-2"><input value={it.name} onChange={e => updateItem(it.id, { name: e.target.value })} className="w-full text-sm text-[#37352F] bg-white border border-[#E9E9E7] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF6C37]" /></td>
                      <td className="px-3 py-2 text-right"><input type="number" value={it.cost} onChange={e => updateItem(it.id, { cost: Math.max(0, parseInt(e.target.value, 10) || 0) })} className="w-28 text-right text-sm tabular-nums bg-white border border-[#E9E9E7] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF6C37]" /></td>
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
              <Input label="가격(P)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="500" />
              <Button onClick={addItem} disabled={!form.name.trim() || !form.cost}>추가</Button>
            </div>
            <p className="text-xs text-[#9B9A97] mt-3">데모: 변경은 이 화면 세션에 저장됩니다.</p>
          </Card>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#37352F] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>
      )}
    </div>
  );
}
