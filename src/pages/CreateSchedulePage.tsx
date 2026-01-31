import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import type { ContentType, DifficultyType, JobClass } from '../types';
import { DIFFICULTY_LIST, CONTENT_LIST } from '../types';
import { format } from 'date-fns';
import './CreateSchedulePage.css';

const CreateSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { createSchedule } = useSchedules();
  const { selectedCharacter } = useUser();
  const { user } = useAuth();

  const [type, setType] = useState<ContentType>('어비스');
  const [contentName, setContentName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyType>('어려움');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('21:00');
  const [maxMembers, setMaxMembers] = useState(8);
  const [note, setNote] = useState('');
  const [leaderJob, setLeaderJob] = useState<JobClass | ''>('');
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (newType: ContentType) => {
    setType(newType);
    setContentName(''); // 종류 변경 시 컨텐츠 선택 초기화
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCharacter) {
      alert('캐릭터를 먼저 등록해주세요.');
      navigate('/characters');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!contentName) {
      alert('컨텐츠를 선택해주세요.');
      return;
    }

    if (!leaderJob) {
      alert('참여할 직업을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      await createSchedule({
        type,
        contentName,
        difficulty,
        title: title.trim() || `${contentName} ${difficulty}`,
        date,
        time,
        maxMembers,
        note,
        isClosed: false,
        leaderId: selectedCharacter.id,
        leaderNickname: `${selectedCharacter.nickname} (${leaderJob})`,
        members: [],
        createdBy: user.id,
      });

      alert('일정이 등록되었습니다!');
      navigate('/');
    } catch (error) {
      alert(error instanceof Error ? error.message : '일정 등록 실패');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCharacter) {
    return (
      <div className="page create-schedule-page">
        <div className="no-character">
          <h2>캐릭터 등록 필요</h2>
          <p>일정을 등록하려면 먼저 캐릭터를 등록해주세요.</p>
          <button className="btn btn-primary" onClick={() => navigate('/characters')}>
            캐릭터 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page create-schedule-page">
      <h2 className="page-title">새 일정 등록</h2>

      <form onSubmit={handleSubmit} className="schedule-form">
        <div className="form-group">
          <label>종류</label>
          <div className="type-select">
            <button
              type="button"
              className={`type-btn ${type === '어비스' ? 'active abyss' : ''}`}
              onClick={() => handleTypeChange('어비스')}
            >
              어비스
            </button>
            <button
              type="button"
              className={`type-btn ${type === '레이드' ? 'active raid' : ''}`}
              onClick={() => handleTypeChange('레이드')}
            >
              레이드
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>컨텐츠</label>
          <select
            value={contentName}
            onChange={(e) => setContentName(e.target.value)}
            className="form-input"
            required
          >
            <option value="">선택해주세요</option>
            {CONTENT_LIST[type].map((content) => (
              <option key={content} value={content}>
                {content}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>난이도</label>
          <div className="difficulty-select">
            {DIFFICULTY_LIST.map((diff) => (
              <button
                key={diff}
                type="button"
                className={`difficulty-btn ${difficulty === diff ? 'active' : ''}`}
                onClick={() => setDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>일정 제목 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder={contentName ? `${contentName} ${difficulty}` : '자동 생성됩니다'}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label>시간</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>최대 인원</label>
          <select
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            className="form-input"
          >
            {[4, 8].map((num) => (
              <option key={num} value={num}>
                {num}명
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>파티장 직업</label>
          <select
            value={leaderJob}
            onChange={(e) => setLeaderJob(e.target.value as JobClass)}
            className="form-input"
            required
          >
            <option value="">직업 선택</option>
            {selectedCharacter.jobs.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>비고 (선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="form-input form-textarea"
            placeholder="추가 안내사항을 입력하세요"
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
          {loading ? '등록 중...' : '일정 등록'}
        </button>
      </form>
    </div>
  );
};

export default CreateSchedulePage;
