import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import ScheduleCard from '../components/ScheduleCard';
import type { Schedule, JobClass, ContentType, DifficultyType } from '../types';
import html2canvas from 'html2canvas';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, loading, joinParty, leaveParty, toggleClosed, deleteSchedule, removeMember, addMemberDirectly, updateMemberJob, updateSchedule } = useSchedules();
  const { selectedCharacter } = useUser();
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [searchNickname, setSearchNickname] = useState('');
  const [savingImage, setSavingImage] = useState(false);
  const scheduleListRef = useRef<HTMLDivElement>(null);

  const filteredSchedules = schedules.filter((schedule) => {
    // 타입 필터
    if (filter !== 'all' && schedule.type !== filter) return false;

    // 닉네임 검색 필터
    if (searchNickname.trim()) {
      const searchTerm = searchNickname.trim().toLowerCase();
      const leaderMatch = schedule.leaderNickname.toLowerCase().includes(searchTerm);
      const memberMatch = schedule.members?.some(
        (member) => member.nickname.toLowerCase().includes(searchTerm)
      );
      return leaderMatch || memberMatch;
    }

    return true;
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

  const handleEditSchedule = async (scheduleId: string, updates: { title: string; date: string; time: string; maxMembers: number; note: string; difficulty: DifficultyType }) => {
    await updateSchedule(scheduleId, updates);
  };

  // 파티 복사 - 복사된 정보를 가지고 일정 등록 페이지로 이동
  const handleCopySchedule = (schedule: Schedule) => {
    const copyData = {
      type: schedule.type,
      contentName: schedule.contentName,
      difficulty: schedule.difficulty,
      title: schedule.title,
      maxMembers: schedule.maxMembers,
      note: schedule.note || '',
    };
    // sessionStorage에 복사 데이터 저장
    sessionStorage.setItem('copyScheduleData', JSON.stringify(copyData));
    navigate('/create');
  };

  // 검색 결과 이미지로 저장
  const handleSaveSearchResults = async () => {
    if (!scheduleListRef.current || filteredSchedules.length === 0) return;

    setSavingImage(true);
    try {
      const canvas = await html2canvas(scheduleListRef.current, {
        backgroundColor: '#0a2647',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${searchNickname}_일정_${new Date().toLocaleDateString('ko-KR')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      alert('이미지 저장에 실패했습니다.');
      console.error(error);
    } finally {
      setSavingImage(false);
    }
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
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="닉네임으로 검색..."
          value={searchNickname}
          onChange={(e) => setSearchNickname(e.target.value)}
        />
        {searchNickname && (
          <>
            <button
              className="search-clear"
              onClick={() => setSearchNickname('')}
            >
              ×
            </button>
          </>
        )}
      </div>

      {/* 검색 결과 저장 버튼 */}
      {searchNickname.trim() && filteredSchedules.length > 0 && (
        <div className="search-actions">
          <span className="search-result-count">
            "{searchNickname}" 검색 결과: {filteredSchedules.length}개
          </span>
          <button
            className="btn btn-save-search"
            onClick={handleSaveSearchResults}
            disabled={savingImage}
          >
            {savingImage ? '저장 중...' : '이미지로 저장'}
          </button>
        </div>
      )}

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
        <div className="schedule-list" ref={scheduleListRef}>
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
              onEditSchedule={handleEditSchedule}
              onCopySchedule={handleCopySchedule}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
