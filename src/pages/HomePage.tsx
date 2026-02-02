import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import ScheduleCard from '../components/ScheduleCard';
import type { Schedule, JobClass, ContentType, DifficultyType, Character } from '../types';
import { getAllCharacters } from '../services/characterService';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import './HomePage.css';

type SaveMode = 'simple' | 'full' | 'all';

type ViewMode = 'card' | 'table';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, loading, joinParty, leaveParty, toggleClosed, deleteSchedule, removeMember, addMemberDirectly, updateMemberJob, updateLeaderJob, updateLeaderNickname, updateMemberNickname, updateSchedule } = useSchedules();
  const { selectedCharacter } = useUser();
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [searchNickname, setSearchNickname] = useState('');
  const [savingImage, setSavingImage] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showExportTable, setShowExportTable] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const scheduleListRef = useRef<HTMLDivElement>(null);
  const exportTableRef = useRef<HTMLDivElement>(null);

  // 등록된 모든 캐릭터 목록 로드
  useEffect(() => {
    const loadCharacters = async () => {
      const characters = await getAllCharacters();
      setAvailableCharacters(characters);
    };
    loadCharacters();
  }, []);

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
  const handleCopySchedule = (schedule: Schedule, includeMembers: boolean) => {
    const copyData = {
      type: schedule.type,
      contentName: schedule.contentName,
      difficulty: schedule.difficulty,
      title: schedule.title,
      maxMembers: schedule.maxMembers,
      note: schedule.note || '',
      // 파티원 포함 복사 시 파티원 정보도 저장
      members: includeMembers ? schedule.members : undefined,
      leaderNickname: includeMembers ? schedule.leaderNickname.split(' (')[0] : undefined,
      leaderJob: includeMembers ? schedule.leaderJob : undefined,
    };
    // sessionStorage에 복사 데이터 저장
    sessionStorage.setItem('copyScheduleData', JSON.stringify(copyData));
    navigate('/create');
  };

  // 파티장 직업 변경
  const handleUpdateLeaderJob = async (scheduleId: string, newJob: JobClass) => {
    await updateLeaderJob(scheduleId, newJob);
  };

  // 파티장 닉네임 변경
  const handleUpdateLeaderNickname = async (scheduleId: string, newNickname: string) => {
    await updateLeaderNickname(scheduleId, newNickname);
  };

  // 파티원 닉네임 변경
  const handleUpdateMemberNickname = async (scheduleId: string, characterId: string, newNickname: string) => {
    await updateMemberNickname(scheduleId, characterId, newNickname);
  };

  // 검색된 닉네임의 직업 가져오기
  const getSearchedUserJob = (schedule: Schedule, nickname: string): string => {
    const searchTerm = nickname.trim().toLowerCase();

    // 파티장인 경우
    if (schedule.leaderNickname.toLowerCase().includes(searchTerm)) {
      return schedule.leaderJob || '파티장';
    }

    // 파티원인 경우
    const member = schedule.members?.find(m =>
      m.nickname.toLowerCase().includes(searchTerm)
    );
    if (member) {
      return member.job;
    }

    return '-';
  };

  // 검색 결과 이미지로 저장
  const handleSaveSearchResults = async (mode: SaveMode = 'full') => {
    if (filteredSchedules.length === 0) return;

    setSavingImage(true);
    setShowSaveOptions(false);

    try {
      if (mode === 'simple') {
        // 간단히 모드: 테이블 형식으로 저장
        setShowExportTable(true);
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!exportTableRef.current) {
          setShowExportTable(false);
          setSavingImage(false);
          return;
        }

        const canvas = await html2canvas(exportTableRef.current, {
          backgroundColor: '#0F3360',
          scale: 2,
        });

        setShowExportTable(false);

        const link = document.createElement('a');
        const prefix = searchNickname.trim() || '전체';
        link.download = `${prefix}_일정_간단_${new Date().toLocaleDateString('ko-KR')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // 전체 모드: 스케줄 카드 형식으로 저장
        if (!scheduleListRef.current) {
          setSavingImage(false);
          return;
        }

        const canvas = await html2canvas(scheduleListRef.current, {
          backgroundColor: '#0a2647',
          scale: 2,
        });

        const link = document.createElement('a');
        const prefix = searchNickname.trim() || '전체';
        link.download = `${prefix}_일정_${new Date().toLocaleDateString('ko-KR')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      alert('이미지 저장에 실패했습니다.');
      console.error(error);
    } finally {
      setSavingImage(false);
      setShowExportTable(false);
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
          <div className="save-btn-container">
            <button
              className="btn btn-save-search"
              onClick={() => setShowSaveOptions(!showSaveOptions)}
              disabled={savingImage}
            >
              {savingImage ? '저장 중...' : '이미지로 저장'}
            </button>
            {showSaveOptions && (
              <div className="save-options">
                <button
                  className="save-option-btn"
                  onClick={() => handleSaveSearchResults('simple')}
                >
                  간단히 (최소 정보)
                </button>
                <button
                  className="save-option-btn"
                  onClick={() => handleSaveSearchResults('full')}
                >
                  전체 일정 저장
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="filter-section">
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
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="카드 보기"
          >
            카드
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="표 보기"
          >
            표
          </button>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <p>등록된 일정이 없습니다</p>
        </div>
      ) : viewMode === 'card' ? (
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
              onUpdateLeaderJob={handleUpdateLeaderJob}
              onUpdateLeaderNickname={handleUpdateLeaderNickname}
              onUpdateMemberNickname={handleUpdateMemberNickname}
              onEditSchedule={handleEditSchedule}
              onCopySchedule={handleCopySchedule}
              searchHighlight={searchNickname.trim()}
              availableCharacters={availableCharacters}
            />
          ))}
        </div>
      ) : (
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>시간</th>
                <th>컨텐츠</th>
                <th>난이도</th>
                <th>제목</th>
                <th>파티장</th>
                <th>인원</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => {
                const currentCount = (schedule.members?.length || 0) + 1;
                const isFull = currentCount >= schedule.maxMembers;
                const isPastSchedule = new Date(`${schedule.date}T${schedule.time}`) < new Date();

                return (
                  <tr
                    key={schedule.id}
                    className={`${schedule.isClosed ? 'closed' : ''} ${isPastSchedule ? 'past' : ''}`}
                    onClick={() => setViewMode('card')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{format(new Date(schedule.date), 'M/d (E)', { locale: ko })}</td>
                    <td>{schedule.time}</td>
                    <td>
                      <span className={`content-badge ${schedule.type}`}>
                        {schedule.contentName}
                      </span>
                    </td>
                    <td>
                      <span className={`difficulty-badge ${schedule.difficulty}`}>
                        {schedule.difficulty}
                      </span>
                    </td>
                    <td className="title-cell">{schedule.title}</td>
                    <td>{schedule.leaderNickname.split(' (')[0]}</td>
                    <td className={isFull ? 'full' : ''}>
                      {currentCount}/{schedule.maxMembers}
                    </td>
                    <td>
                      {isPastSchedule ? (
                        <span className="status-badge past">종료</span>
                      ) : schedule.isClosed ? (
                        <span className="status-badge closed">마감</span>
                      ) : isFull ? (
                        <span className="status-badge full">인원마감</span>
                      ) : (
                        <span className="status-badge open">모집중</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 이미지 내보내기용 테이블 (화면에 숨김) */}
      {showExportTable && (
        <div className="export-table-container" ref={exportTableRef}>
          <div className="export-header">
            <h2>새녘 모비노기 스케줄러</h2>
            {searchNickname.trim() && (
              <p className="export-nickname">{searchNickname}님의 일정</p>
            )}
            <p className="export-date">{format(new Date(), 'yyyy년 M월 d일 (E)', { locale: ko })}</p>
          </div>
          <table className="export-table">
            <thead>
              <tr>
                <th>날짜/시간</th>
                <th>컨텐츠</th>
                <th>난이도</th>
                <th>파티장</th>
                <th>직업</th>
                <th>인원</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{format(new Date(schedule.date), 'M/d')} {schedule.time}</td>
                  <td>{schedule.contentName}</td>
                  <td>{schedule.difficulty}</td>
                  <td>{schedule.leaderNickname.split(' (')[0]}</td>
                  <td>{getSearchedUserJob(schedule, searchNickname)}</td>
                  <td>{(schedule.members?.length || 0) + 1}/{schedule.maxMembers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HomePage;
