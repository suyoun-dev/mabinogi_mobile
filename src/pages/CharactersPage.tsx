import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import type { JobClass, Character } from '../types';
import { JOB_LIST } from '../types';
import * as scheduleService from '../services/scheduleService';
import './CharactersPage.css';

const CharactersPage: React.FC = () => {
  const { characters, selectedCharacter, createCharacter, updateCharacter, deleteCharacter, selectCharacter, loading } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<JobClass[]>([]);
  const [existingNicknames, setExistingNicknames] = useState<Set<string>>(new Set());
  const [nicknameError, setNicknameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Firebase에서 기존 닉네임 목록 불러오기
  useEffect(() => {
    const loadExistingNicknames = async () => {
      try {
        const schedules = await scheduleService.getAllSchedules();
        const nicknames = new Set<string>();

        schedules.forEach(schedule => {
          // 파티장 닉네임
          if (schedule.leaderNickname) {
            nicknames.add(schedule.leaderNickname.toLowerCase());
          }
          // 파티원 닉네임
          schedule.members?.forEach(member => {
            if (member.nickname) {
              nicknames.add(member.nickname.toLowerCase());
            }
          });
        });

        setExistingNicknames(nicknames);
      } catch (error) {
        console.error('닉네임 목록 불러오기 실패:', error);
      }
    };

    loadExistingNicknames();
  }, []);

  // 닉네임 중복 확인
  const checkDuplicateNickname = (name: string): boolean => {
    const trimmedName = name.trim().toLowerCase();

    // 자신의 캐릭터 중 중복 확인 (수정 시 현재 캐릭터 제외)
    const isDuplicateLocal = characters.some(char =>
      char.nickname.toLowerCase() === trimmedName &&
      (!editingChar || char.id !== editingChar.id)
    );

    // Firebase 일정에서 중복 확인 (수정 시 현재 닉네임 제외)
    const isDuplicateGlobal = existingNicknames.has(trimmedName) &&
      (!editingChar || editingChar.nickname.toLowerCase() !== trimmedName);

    return isDuplicateLocal || isDuplicateGlobal;
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value.trim() && checkDuplicateNickname(value)) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
    } else {
      setNicknameError('');
    }
  };

  const resetForm = () => {
    setNickname('');
    setSelectedJobs([]);
    setEditingChar(null);
    setShowForm(false);
    setNicknameError('');
  };

  const handleJobToggle = (job: JobClass) => {
    setSelectedJobs((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (checkDuplicateNickname(nickname)) {
      alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      return;
    }

    if (selectedJobs.length === 0) {
      alert('최소 하나의 직업을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingChar) {
        await updateCharacter(editingChar.id, { nickname: nickname.trim(), jobs: selectedJobs });
        alert('캐릭터가 수정되었습니다.');
      } else {
        await createCharacter(nickname.trim(), selectedJobs);
        alert('캐릭터가 등록되었습니다.');
      }
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (char: Character) => {
    setEditingChar(char);
    setNickname(char.nickname);
    setSelectedJobs([...char.jobs]);
    setShowForm(true);
  };

  const handleDelete = async (char: Character) => {
    if (confirm(`'${char.nickname}' 캐릭터를 삭제하시겠습니까?`)) {
      try {
        await deleteCharacter(char.id);
      } catch (error) {
        alert('캐릭터 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page characters-page">
        <div className="loading-state">
          <p>캐릭터 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page characters-page">
      <div className="page-header">
        <h2 className="page-title">캐릭터 관리</h2>
        {!showForm && (
          <button
            className="btn btn-primary btn-add"
            onClick={() => setShowForm(true)}
          >
            + 추가
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="character-form">
          <h3>{editingChar ? '캐릭터 수정' : '새 캐릭터 등록'}</h3>
          <p className="form-guide">
            본인의 본캐 닉네임을 입력 후, 직업은 부캐 포함 전체 직업으로 선택!
          </p>

          <div className="form-group">
            <label>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              className={`form-input ${nicknameError ? 'input-error' : ''}`}
              placeholder="게임 내 닉네임"
              required
            />
            {nicknameError && <span className="error-text">{nicknameError}</span>}
          </div>

          <div className="form-group">
            <label>직업 (복수 선택 가능)</label>
            <div className="job-grid">
              {JOB_LIST.map((job) => (
                <button
                  key={job}
                  type="button"
                  className={`job-btn ${selectedJobs.includes(job) ? 'selected' : ''}`}
                  onClick={() => handleJobToggle(job)}
                >
                  {job}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '저장 중...' : (editingChar ? '수정' : '등록')}
            </button>
          </div>
        </form>
      )}

      {characters.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>등록된 캐릭터가 없습니다</p>
          <p className="sub">캐릭터를 등록하면 일정에 참여할 수 있습니다</p>
        </div>
      ) : (
        <div className="character-list">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`character-card ${selectedCharacter?.id === char.id ? 'selected' : ''}`}
            >
              <div className="character-info" onClick={() => selectCharacter(char.id)}>
                <div className="character-header">
                  <span className="character-nickname">{char.nickname}</span>
                  {selectedCharacter?.id === char.id && (
                    <span className="selected-badge">선택됨</span>
                  )}
                </div>
                <div className="character-jobs">
                  {char.jobs.map((job) => (
                    <span key={job} className="job-tag">
                      {job}
                    </span>
                  ))}
                </div>
              </div>
              <div className="character-actions">
                <button
                  className="action-btn edit"
                  onClick={() => handleEdit(char)}
                  title="수정"
                >
                  수정
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(char)}
                  title="삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {characters.length > 0 && (
        <p className="hint">캐릭터를 탭하면 해당 캐릭터로 전환됩니다</p>
      )}
    </div>
  );
};

export default CharactersPage;
