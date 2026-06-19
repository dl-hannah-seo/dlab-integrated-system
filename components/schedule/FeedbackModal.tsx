'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import {
  students, classes, FEEDBACK_PHASES, CURRENT_SEMESTER_ID, type FeedbackPhase,
} from '@/lib/mock-data';
import { useFeedbacks } from '@/components/panels/FeedbackContext';
import { studentsOfClass, classPhaseRate, feedbackOf } from '@/lib/feedback';

const PHASE_COLOR: Record<FeedbackPhase, string> = {
  '그리팅': '#28C76F', '중간': '#2F6BFF', '파이널': '#2F6BFF',
};

export function FeedbackModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const cls = classes.find(c => c.id === classId);
  const { feedbacks, completeFeedback } = useFeedbacks();
  const roster = studentsOfClass(students, classId);

  // 인라인 메모 입력 대상 (학생×단계)
  const [editing, setEditing] = useState<{ studentId: string; phase: FeedbackPhase } | null>(null);
  const [memo, setMemo] = useState('');

  if (!cls) return null;

  function openMemo(studentId: string, phase: FeedbackPhase) {
    const existing = feedbackOf(feedbacks, studentId, CURRENT_SEMESTER_ID, phase);
    setMemo(existing?.memo ?? '');
    setEditing({ studentId, phase });
  }
  function save() {
    if (!editing || !memo.trim()) return;
    completeFeedback({
      studentId: editing.studentId,
      phase: editing.phase,
      memo,
      counselor: cls!.teacher,
    });
    setEditing(null);
    setMemo('');
  }

  return (
    <Modal open onClose={onClose} title={`${cls.schedule} · ${cls.course} — 학부모 피드백`} size="lg">
      {/* 단계별 완료율 요약 */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {FEEDBACK_PHASES.map(phase => {
          const rate = classPhaseRate(students, feedbacks, classId, CURRENT_SEMESTER_ID, phase);
          return (
            <div key={phase} className="rounded-lg border border-[#E8EBF1] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1D29]">{phase}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: PHASE_COLOR[phase] }}>{rate}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#EEF1F5]">
                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: PHASE_COLOR[phase] }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mb-2 text-xs text-[#9CA3AF]">미완료 단계를 클릭하면 상담 메모를 입력하고 완료 처리합니다.</p>

      {/* 학생 × 단계 표 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F4F6FA] border-b border-[#E8EBF1] text-left text-[#1A1D29]">
              <th className="px-3 py-2 font-semibold">학생</th>
              {FEEDBACK_PHASES.map(p => <th key={p} className="px-3 py-2 font-semibold text-center">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {roster.map(s => (
              <tr key={s.id} className="border-b border-[#EEF1F5]">
                <td className="px-3 py-2 text-[#1A1D29]">{s.name} <span className="text-xs text-[#9CA3AF]">{s.grade}</span></td>
                {FEEDBACK_PHASES.map(phase => {
                  const fb = feedbackOf(feedbacks, s.id, CURRENT_SEMESTER_ID, phase);
                  const done = fb?.done ?? false;
                  return (
                    <td key={phase} className="px-3 py-2 text-center">
                      <button
                        onClick={() => openMemo(s.id, phase)}
                        title={done ? fb?.memo : '클릭해 상담 메모 입력'}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs transition-colors ${
                          done
                            ? 'bg-[#E6F9EF] text-[#28C76F] hover:bg-[#E6F9EF]'
                            : 'border border-dashed border-[#E8EBF1] text-[#AEB4C0] hover:border-[#2F6BFF] hover:text-[#2F6BFF]'
                        }`}
                      >
                        {done ? '✓' : '＋'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {roster.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-[#6B7280]">재원생 명단이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 인라인 메모 입력 */}
      {editing && (
        <div className="mt-4 rounded-lg border border-[#2F6BFF]/40 bg-[#EAF1FF] p-4 space-y-3">
          <p className="text-sm font-medium text-[#1A1D29]">
            {roster.find(s => s.id === editing.studentId)?.name} · {editing.phase} 피드백
          </p>
          <Textarea
            rows={4}
            value={memo}
            autoFocus
            placeholder="학부모 상담 내용을 입력하세요"
            onChange={e => setMemo(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>취소</Button>
            <Button size="sm" onClick={save} disabled={!memo.trim()}>완료 처리</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
