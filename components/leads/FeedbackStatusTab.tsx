'use client';

import { useMemo } from 'react';
import { students, classes, FEEDBACK_PHASES, CURRENT_SEMESTER_ID } from '@/lib/mock-data';
import { useFeedbacks } from '@/components/panels/FeedbackContext';
import { studentsOfClass, classPhaseRate, isPhaseDone } from '@/lib/feedback';
import { useRole } from '@/components/layout/RoleContext';
import { DEMO_TEACHER_ID } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { Card } from '@/components/ui/Card';

const PHASE_COLOR: Record<string, string> = {
  '그리팅': '#28C76F', '중간': '#2F6BFF', '파이널': '#2F6BFF',
};

function PhaseBar({ rate, color }: { rate: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[#EEF1F5]">
      <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: color }} />
    </div>
  );
}

export function FeedbackStatusTab() {
  const { role } = useRole();
  const isTeacher = role === '교사';
  const { feedbacks } = useFeedbacks();

  const scopeClasses = useMemo(
    () => (isTeacher ? classesOfTeacher(DEMO_TEACHER_ID, classes) : classes.filter(c => c.enrolled_count > 0)),
    [isTeacher],
  );

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {scopeClasses.map(cls => {
          const roster = studentsOfClass(students, cls.id);
          return (
            <Card key={cls.id} title={`${cls.schedule} · ${cls.course}`}>
              <p className="mb-3 text-xs text-[#6B7280]">담당 {cls.teacher} · 재원 {roster.length}명</p>

              {/* 단계별 완료율 3종 */}
              <div className="space-y-2.5">
                {FEEDBACK_PHASES.map(phase => {
                  const rate = classPhaseRate(students, feedbacks, cls.id, CURRENT_SEMESTER_ID, phase);
                  const incomplete = roster.filter(s => !isPhaseDone(feedbacks, s.id, CURRENT_SEMESTER_ID, phase));
                  return (
                    <div key={phase}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1A1D29]">{phase}</span>
                        <span className="tabular-nums text-[#6B7280]">
                          {roster.length - incomplete.length}/{roster.length} · {rate}%
                        </span>
                      </div>
                      <PhaseBar rate={rate} color={PHASE_COLOR[phase]} />
                      {incomplete.length > 0 && (
                        <p className="mt-1 text-[11px] text-[#9CA3AF]">
                          미완료: {incomplete.slice(0, 6).map(s => s.name).join(', ')}
                          {incomplete.length > 6 ? ` 외 ${incomplete.length - 6}명` : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
