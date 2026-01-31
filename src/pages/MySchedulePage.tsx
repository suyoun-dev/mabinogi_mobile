import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import ScheduleCard from '../components/ScheduleCard';
import type { JobClass } from '../types';
import './MySchedulePage.css';

const MySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, loading, joinParty, leaveParty, toggleClosed, deleteSchedule } = useSchedules();
  const { selectedCharacter } = useUser();

  const mySchedules = selectedCharacter
    ? schedules.filter((schedule) => {
        if (schedule.leaderId === selectedCharacter.id) return true;
        if (schedule.members?.some((m) => m.characterId === selectedCharacter.id)) return true;
        return false;
      })
    : [];

  const handleJoin = async (scheduleId: string, job: JobClass) => {
    if (!selectedCharacter) return;
    await joinParty(scheduleId, {
      characterId: selectedCharacter.id,
      nickname: selectedCharacter.nickname,
      job,
      joinedAt: Date.now(),
    });
  };

  const handleLeave = async (scheduleId: string) => {
    if (!selectedCharacter) return;
    await leaveParty(scheduleId, selectedCharacter.id);
  };

  const handleToggleClosed = async (scheduleId: string, isClosed: boolean) => {
    await toggleClosed(scheduleId, isClosed);
  };

  const handleDelete = async (scheduleId: string) => {
    await deleteSchedule(scheduleId);
  };

  if (!selectedCharacter) {
    return (
      <div className="page my-schedule-page">
        <div className="no-character">
          <h2>캐릭터 등록 필요</h2>
          <p>내 일정을 확인하려면 먼저 캐릭터를 등록해주세요.</p>
          <button className="btn btn-primary" onClick={() => navigate('/characters')}>
            캐릭터 등록하기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page loading">
        <div className="spinner"></div>
        <p>일정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page my-schedule-page">
      <div className="my-schedule-header">
        <h2 className="page-title">내 일정</h2>
        <span className="character-name">{selectedCharacter.nickname}</span>
      </div>

      {mySchedules.length === 0 ? (
        <div className="empty-state">
          <p>참여 중인 일정이 없습니다</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            일정 둘러보기
          </button>
        </div>
      ) : (
        <div className="schedule-list">
          {mySchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onToggleClosed={handleToggleClosed}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MySchedulePage;
