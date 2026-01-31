import React, { useState } from 'react';
import type { Schedule, JobClass } from '../types';
import { useUser } from '../contexts/UserContext';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import './ScheduleCard.css';

interface ScheduleCardProps {
  schedule: Schedule;
  onJoin: (scheduleId: string, job: JobClass) => Promise<void>;
  onLeave: (scheduleId: string) => Promise<void>;
  onToggleClosed?: (scheduleId: string, isClosed: boolean) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onJoin,
  onLeave,
  onToggleClosed,
  onDelete,
}) => {
  const { selectedCharacter } = useUser();
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const scheduleDate = parseISO(schedule.date);
  const isScheduleToday = isToday(scheduleDate);
  const isScheduleTomorrow = isTomorrow(scheduleDate);
  const isPastSchedule = isPast(new Date(`${schedule.date}T${schedule.time}`));

  const formatDateLabel = () => {
    if (isScheduleToday) return '오늘';
    if (isScheduleTomorrow) return '내일';
    return format(scheduleDate, 'M/d (E)', { locale: ko });
  };

  const isLeader = selectedCharacter?.id === schedule.leaderId;
  const isMember = schedule.members?.some(
    (m) => m.characterId === selectedCharacter?.id
  );
  const currentCount = (schedule.members?.length || 0) + 1; // 파티장 포함
  const isFull = currentCount >= schedule.maxMembers;

  const handleJoin = async (job: JobClass) => {
    if (!selectedCharacter) return;
    setLoading(true);
    try {
      await onJoin(schedule.id, job);
      setShowJobSelect(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '참여 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedCharacter) return;
    if (!confirm('정말 파티를 탈퇴하시겠습니까?')) return;
    setLoading(true);
    try {
      await onLeave(schedule.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '탈퇴 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClosed = async () => {
    if (!onToggleClosed) return;
    setLoading(true);
    try {
      await onToggleClosed(schedule.id, !schedule.isClosed);
    } catch (error) {
      alert(error instanceof Error ? error.message : '상태 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      await onDelete(schedule.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`schedule-card ${schedule.isClosed ? 'closed' : ''} ${
        isPastSchedule ? 'past' : ''
      }`}
    >
      <div className="schedule-header">
        <div className="schedule-type-badge" data-type={schedule.type}>
          {schedule.type}
        </div>
        {schedule.difficulty && (
          <div className="schedule-difficulty-badge" data-difficulty={schedule.difficulty}>
            {schedule.difficulty}
          </div>
        )}
        <div className="schedule-date-time">
          <span className="date-label">{formatDateLabel()}</span>
          <span className="time">{schedule.time}</span>
        </div>
        {schedule.isClosed && <span className="closed-badge">마감</span>}
      </div>

      <h3 className="schedule-title">{schedule.title}</h3>

      <div className="schedule-info">
        <div className="leader-info">
          <span className="label">파티장</span>
          <span className="value">{schedule.leaderNickname}</span>
        </div>
        <div className="member-count">
          <span className="label">인원</span>
          <span className={`value ${isFull ? 'full' : ''}`}>
            {currentCount}/{schedule.maxMembers}
          </span>
        </div>
      </div>

      {schedule.members && schedule.members.length > 0 && (
        <div className="members-list">
          <span className="label">참여자</span>
          <div className="members">
            {schedule.members.map((member, idx) => (
              <span key={idx} className="member-tag">
                {member.nickname}
                <small>({member.job})</small>
              </span>
            ))}
          </div>
        </div>
      )}

      {schedule.note && (
        <div className="schedule-note">
          <span className="label">비고</span>
          <span className="value">{schedule.note}</span>
        </div>
      )}

      <div className="schedule-actions">
        {!selectedCharacter ? (
          <p className="no-character-msg">캐릭터를 먼저 등록해주세요</p>
        ) : isLeader ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleToggleClosed}
              disabled={loading}
            >
              {schedule.isClosed ? '마감 해제' : '마감하기'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              삭제
            </button>
          </>
        ) : isMember ? (
          <button
            className="btn btn-danger"
            onClick={handleLeave}
            disabled={loading}
          >
            탈퇴하기
          </button>
        ) : schedule.isClosed || isFull ? (
          <button className="btn btn-disabled" disabled>
            {schedule.isClosed ? '마감됨' : '인원 마감'}
          </button>
        ) : showJobSelect ? (
          <div className="job-select-container">
            <select
              className="job-select"
              onChange={(e) => handleJoin(e.target.value as JobClass)}
              disabled={loading}
              defaultValue=""
            >
              <option value="" disabled>
                직업 선택
              </option>
              {selectedCharacter.jobs.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => setShowJobSelect(false)}
            >
              취소
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setShowJobSelect(true)}
            disabled={loading}
          >
            참여하기
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
