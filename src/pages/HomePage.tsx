import React, { useState } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import ScheduleCard from '../components/ScheduleCard';
import type { JobClass, ContentType } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { schedules, loading, joinParty, leaveParty, toggleClosed, deleteSchedule, removeMember, addMemberDirectly, updateMemberJob } = useSchedules();
  const { selectedCharacter } = useUser();
  const [filter, setFilter] = useState<ContentType | 'all'>('all');

  const filteredSchedules = schedules.filter((schedule) => {
    if (filter === 'all') return true;
    return schedule.type === filter;
  });

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

  const handleRemoveMember = async (scheduleId: string, characterId: string) => {
    await removeMember(scheduleId, characterId);
  };

  const handleAddMemberDirectly = async (scheduleId: string, nickname: string, job: string) => {
    await addMemberDirectly(scheduleId, nickname, job);
  };

  const handleUpdateMemberJob = async (scheduleId: string, characterId: string, newJob: JobClass) => {
    await updateMemberJob(scheduleId, characterId, newJob);
  };

  if (loading) {
    return (
      <div className="page loading">
        <div className="spinner"></div>
        <p>일정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={`filter-tab ${filter === '어비스' ? 'active' : ''}`}
          onClick={() => setFilter('어비스')}
        >
          어비스
        </button>
        <button
          className={`filter-tab ${filter === '레이드' ? 'active' : ''}`}
          onClick={() => setFilter('레이드')}
        >
          레이드
        </button>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <p>등록된 일정이 없습니다</p>
        </div>
      ) : (
        <div className="schedule-list">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onToggleClosed={handleToggleClosed}
              onDelete={handleDelete}
              onRemoveMember={handleRemoveMember}
              onAddMemberDirectly={handleAddMemberDirectly}
              onUpdateMemberJob={handleUpdateMemberJob}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
