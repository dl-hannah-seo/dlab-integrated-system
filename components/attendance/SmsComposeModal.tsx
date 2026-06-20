'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Input';
import {
  logConsultation,
  TODAY,
  type Student,
  type Class,
  type ClassSession,
} from '@/lib/mock-data';

function mmdd(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

type TemplateKey = 'absence' | 'makeup';

function buildMessage(key: TemplateKey, student: Student, cls: Class, session: ClassSession) {
  const when = `${mmdd(session.session_date)} ${cls.schedule}`;
  if (key === 'makeup') {
    return `[디랩] ${student.name} 학생 학부모님, ${when} ${cls.course} 수업 결석으로 보강 일정을 안내드립니다. 가능하신 일정 회신 부탁드립니다.`;
  }
  return `[디랩] ${student.name} 학생 학부모님, ${when} ${cls.course} 수업에 결석하여 안내드립니다. 확인 후 회신 부탁드립니다.`;
}

interface SmsComposeModalProps {
  student: Student;
  cls: Class;
  session: ClassSession;
  onClose: () => void;
  onSent: (message: string) => void;
}

export function SmsComposeModal({ student, cls, session, onClose, onSent }: SmsComposeModalProps) {
  const [template, setTemplate] = useState<TemplateKey>('absence');
  const [message, setMessage] = useState(() => buildMessage('absence', student, cls, session));

  function changeTemplate(key: TemplateKey) {
    setTemplate(key);
    setMessage(buildMessage(key, student, cls, session));
  }

  function send() {
    logConsultation(student.id, message.trim(), TODAY);
    onSent(`${student.name} 학부모님께 문자를 보냈습니다.`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`문자 보내기 · ${student.name}`}
      footer={
        <>
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#1A1D29]">
            취소
          </button>
          <button
            onClick={send}
            disabled={!message.trim()}
            className="px-3.5 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] disabled:opacity-50"
          >
            전송
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-[#6B7280]">
          받는 사람 <span className="text-[#1A1D29]">학부모 · {student.parent_phone}</span>
        </div>
        <Select
          label="템플릿"
          value={template}
          onChange={e => changeTemplate(e.target.value as TemplateKey)}
          options={[
            { value: 'absence', label: '결석 안내' },
            { value: 'makeup', label: '보강 안내' },
          ]}
        />
        <Textarea
          label="메시지"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
        />
      </div>
    </Modal>
  );
}
