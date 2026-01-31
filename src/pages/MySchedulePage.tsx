import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import ScheduleCard from '../components/ScheduleCard';
import type { JobClass, Schedule } from '../types';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import './MySchedulePage.css';

const MySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, loading, joinParty, leaveParty, toggleClosed, deleteSchedule, removeMember, addMemberDirectly, updateMemberJob } = useSchedules();
  const { selectedCharacter } = useUser();
  const scheduleTableRef = useRef<HTMLDivElement>(null);
  const [showExportTable, setShowExportTable] = useState(false);

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

  const handleRemoveMember = async (scheduleId: string, characterId: string) => {
    await removeMember(scheduleId, characterId);
  };

  const handleAddMemberDirectly = async (scheduleId: string, nickname: string, job: string) => {
    await addMemberDirectly(scheduleId, nickname, job);
  };

  const handleUpdateMemberJob = async (scheduleId: string, characterId: string, newJob: JobClass) => {
    await updateMemberJob(scheduleId, characterId, newJob);
  };

  // 본인 신청 직업 가져오기
  const getMyJob = (schedule: Schedule): string => {
    if (schedule.leaderId === selectedCharacter?.id) {
      return schedule.leaderJob || '파티장';
    }
    const myMember = schedule.members?.find(m => m.characterId === selectedCharacter?.id);
    return myMember?.job || '-';
  };

  const handleDownloadImage = async () => {
    if (mySchedules.length === 0) return;

    // 먼저 테이블을 표시
    setShowExportTable(true);

    // DOM 업데이트 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!scheduleTableRef.current) {
      setShowExportTable(false);
      return;
    }

    try {
      const canvas = await html2canvas(scheduleTableRef.current, {
        backgroundColor: '#0F3360',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `내일정_${selectedCharacter?.nickname}_${new Date().toLocaleDateString('ko-KR')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      alert('이미지 다운로드 실패');
    } finally {
      setShowExportTable(false);
    }
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
        <>
          <div className="download-section">
            <button className="btn btn-secondary download-btn" onClick={handleDownloadImage}>
              이미지로 저장
            </button>
          </div>
          <div className="schedule-list">
            {mySchedules.map((schedule) => (
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
        </>
      )}

      {/* 이미지 내보내기용 테이블 (화면에 숨김) */}
      {showExportTable && (
        <div className="export-table-container" ref={scheduleTableRef}>
          <div className="export-header">
            <h2>새녘 모비노기 스케줄러</h2>
            <p className="export-nickname">{selectedCharacter.nickname}님의 일정</p>
            <p className="export-date">{format(new Date(), 'yyyy년 M월 d일 (E)', { locale: ko })}</p>
          </div>
          <table className="export-table">
            <thead>
              <tr>
                <th>날짜/시간</th>
                <th>컨텐츠</th>
                <th>난이도</th>
                <th>파티장</th>
                <th>내 직업</th>
              </tr>
            </thead>
            <tbody>
              {mySchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{format(new Date(schedule.date), 'M/d')} {schedule.time}</td>
                  <td>{schedule.contentName}</td>
                  <td>{schedule.difficulty}</td>
                  <td>{schedule.leaderNickname.split(' (')[0]}</td>
                  <td>{getMyJob(schedule)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MySchedulePage;
