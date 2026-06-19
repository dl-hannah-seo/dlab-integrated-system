'use client';

import { useState, useMemo, useEffect } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { AttendanceDot } from '@/components/ui/Badge';
import { classes, todaySessions, initialAttendance, getStudentsByClass, TODAY, type Student } from '@/lib/mock-data';
import { useMakeup } from '@/components/panels/MakeupContext';
import { MakeupPickerModal } from '@/components/attendance/MakeupPickerModal';
import { buildMakeupMessage } from '@/lib/makeup-helpers';
// DEMO ONLY ↓↓↓
import { useAttendanceDemo } from '@/components/panels/useAttendanceDemo';
// DEMO ONLY ↑↑↑

export function AttendancePanel() {
  const { activePanel, close, openSms, attendanceOverrides, setOverride } = useQuickActions();
  const { requestMakeup, scheduleMakeup, findActive } = useMakeup();
  const open = activePanel === 'attendance';

  const [makeupTarget, setMakeupTarget] = useState<Student | null>(null);

  // DEMO ONLY ↓↓↓
  const demo = useAttendanceDemo(open);
  // DEMO ONLY ↑↑↑

  const todayClasses = useMemo(
    () => classes.filter(c => todaySessions.some(s => s.class_id === c.id)),
    []
  );

  const [selectedClassId, setSelectedClassId] = useState(todayClasses[0]?.id ?? '');

  const selectedClass = todayClasses.find(c => c.id === selectedClassId);
  const session = todaySessions.find(s => s.class_id === selectedClassId);
  const classStudents = useMemo(() => getStudentsByClass(selectedClassId), [selectedClassId]);

  // DEMO ONLY ↓↓↓ — 반 변경 시 데모 초기화
  useEffect(() => { demo.reset(); }, [selectedClassId, demo.reset]);
  // DEMO ONLY ↑↑↑

  const attendedIds = new Set(
    initialAttendance.filter(a => a.status === 'attend').map(a => a.student_id)
  );
  // DEMO ONLY ↓↓↓ — 데모 점등 학생을 출석에 합침
  demo.demoAttendedIds.forEach(id => attendedIds.add(id));
  // DEMO ONLY ↑↑↑

  const attendedStudents = classStudents.filter(s => attendedIds.has(s.id));
  const processedStudents = classStudents.filter(s => !attendedIds.has(s.id) && !!attendanceOverrides[s.id]);
  const pendingStudents = classStudents.filter(s => !attendedIds.has(s.id) && !attendanceOverrides[s.id]);

  // 미도착 + 결석/지각 처리 학생만 문자 대상 (수동 출석은 제외)
  const smsTargets = [
    ...pendingStudents,
    ...processedStudents.filter(s => attendanceOverrides[s.id] !== 'attend'),
  ];

  function handleSendSms() {
    const targets = smsTargets;
    openSms({
      recipients: targets.map(s => ({ studentId: s.id, name: s.name, phone: s.parent_phone })),
      template: 'absence',
    });
  }

  return (
    <>
    <SlidePanel open={open} onClose={close} title="출석 체크">
      <div className="px-5 py-4 space-y-5">
        {/* 반 선택 */}
        <Select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          options={todayClasses.map(c => ({ value: c.id, label: `${c.schedule} ${c.course}` }))}
        />

        {session && (
          <p className="text-xs text-[#6B7280]">
            수업시작 {session.start_time} · 담당 {selectedClass?.teacher}
          </p>
        )}

        {/* DEMO ONLY ↓↓↓ — 시연 재생 컨트롤 (추후 삭제) */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#2F6BFF]/40 bg-[#EAF1FF]">
          <span className="text-[10px] font-semibold text-[#2F6BFF] uppercase tracking-wider">시연</span>
          <button
            onClick={demo.play}
            disabled={demo.isPlaying || demo.isComplete}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#2F6BFF] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1F57E6] transition-colors"
          >
            ▶ {demo.isPlaying ? '시연 중…' : '출석 시연'}
          </button>
          <button
            onClick={demo.reset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-[#E8EBF1] text-[#6B7280] hover:bg-white transition-colors"
          >
            ↺ 초기화
          </button>
          <span className="ml-auto text-xs text-[#6B7280]">{demo.playedCount}/{demo.totalCount}</span>
        </div>
        {/* DEMO ONLY ↑↑↑ */}

        {/* 키오스크 출석 완료 */}
        {attendedStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#28C76F] mb-2">
              ✅ 출석 (키오스크) {attendedStudents.length}명
            </p>
            <div className="flex flex-wrap gap-1.5">
              {attendedStudents.map(s => (
                <span
                  key={s.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#E6F9EF] border border-[#28C76F]/20 rounded-full text-xs text-[#28C76F]"
                >
                  <AttendanceDot status="attend" />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 처리 완료 */}
        {processedStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] mb-2">처리 완료 {processedStudents.length}명</p>
            <div className="space-y-1.5">
              {processedStudents.map(s => {
                const ov = attendanceOverrides[s.id];
                const mk = ov === 'absent' ? findActive(s.id, selectedClassId) : undefined;
                return (
                  <div key={s.id} className="px-3 py-2 bg-[#F4F6FA] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#1A1D29]">{s.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ov === 'attend'
                          ? 'bg-[#E6F9EF] text-[#28C76F]'
                          : ov === 'late'
                            ? 'bg-[#FFF4E0] text-[#C18A14]'
                            : 'bg-[#FEE9EA] text-[#F2474B]'
                      }`}>
                        {ov === 'attend' ? '출석' : ov === 'late' ? '지각' : '결석'}
                      </span>
                    </div>
                    {ov === 'absent' && (
                      <div className="flex items-center justify-between gap-2">
                        {mk?.status === '예정' ? (
                          <span className="text-xs text-[#28C76F]">보강 {mk.makeup_date} {mk.makeup_time} 예정</span>
                        ) : (
                          <span className="text-xs text-[#F2474B]">보강 미정</span>
                        )}
                        {mk?.status !== '예정' && (
                          <button
                            onClick={() => setMakeupTarget(s)}
                            className="text-xs px-2.5 py-1 rounded-md border border-[#2F6BFF] text-[#2F6BFF] hover:bg-[#EAF1FF] transition-colors shrink-0"
                          >
                            지금 보강 잡기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 미도착 */}
        {pendingStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#F2474B] mb-2">
              ⚠️ 미도착 {pendingStudents.length}명
            </p>
            <div className="space-y-2">
              {pendingStudents.map(s => (
                <div
                  key={s.id}
                  className="px-3 py-2 bg-[#FEE9EA]/40 border border-[#F2474B]/20 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#1A1D29]">{s.name}</span>
                    <a
                      href={`tel:${s.parent_phone.replace(/[^0-9]/g, '')}`}
                      className="flex items-center gap-1 text-xs text-[#2F6BFF] hover:underline shrink-0"
                      title="보호자에게 전화"
                    >
                      📞 {s.parent_phone}
                    </a>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setOverride(s.id, 'attend')}
                      className="px-2.5 py-1 text-xs rounded-md bg-[#E6F9EF] text-[#28C76F] border border-[#28C76F]/30 hover:bg-[#28C76F]/10 transition-colors"
                    >
                      출석
                    </button>
                    <button
                      onClick={() => setOverride(s.id, 'late')}
                      className="px-2.5 py-1 text-xs rounded-md bg-[#FFF4E0] text-[#C18A14] border border-[#C18A14]/30 hover:bg-[#C18A14]/10 transition-colors"
                    >
                      지각
                    </button>
                    <button
                      onClick={() => {
                        setOverride(s.id, 'absent');
                        requestMakeup(s.id, selectedClassId, session?.session_date ?? TODAY);
                      }}
                      className="px-2.5 py-1 text-xs rounded-md bg-[#FEE9EA] text-[#F2474B] border border-[#F2474B]/30 hover:bg-[#F2474B]/10 transition-colors"
                    >
                      결석
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전원 출석 (미도착·결석·지각 없음) */}
        {pendingStudents.length === 0 &&
          smsTargets.length === 0 &&
          attendedStudents.length + processedStudents.length > 0 && (
          <div className="text-center py-4 text-sm text-[#28C76F] font-medium">
            🎉 전원 출석 완료
          </div>
        )}

        {/* 문자발송 연동 */}
        {smsTargets.length > 0 && (
          <div className="pt-2 border-t border-[#E8EBF1]">
            <Button className="w-full" variant="secondary" onClick={handleSendSms}>
              미도착/결석 {smsTargets.length}명 문자발송
            </Button>
          </div>
        )}
      </div>
    </SlidePanel>

    {makeupTarget && selectedClass && (
      <MakeupPickerModal
        student={makeupTarget}
        cls={selectedClass}
        onClose={() => setMakeupTarget(null)}
        onConfirm={(date, time, memo) => {
          const req = findActive(makeupTarget.id, selectedClassId)
            ?? requestMakeup(makeupTarget.id, selectedClassId, session?.session_date ?? TODAY);
          scheduleMakeup(req.id, date, time, memo);
          openSms({
            recipients: [{ studentId: makeupTarget.id, name: makeupTarget.name, phone: makeupTarget.parent_phone }],
            template: 'makeup',
            message: buildMakeupMessage(makeupTarget.name, selectedClass.course, date, time),
          });
          setMakeupTarget(null);
        }}
      />
    )}
    </>
  );
}
