import React, { useState, useMemo } from 'react';
import type { Schedule, JobClass, DifficultyType, Character } from '../types';
import { JOB_LIST, DIFFICULTY_LIST } from '../types';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import './ScheduleCard.css';

interface ScheduleEditData {
  title: string;
  date: string;
  time: string;
  maxMembers: number;
  note: string;
  difficulty: DifficultyType;
}

interface ScheduleCardProps {
  schedule: Schedule;
  onJoin: (scheduleId: string, job: JobClass) => Promise<void>;
  onLeave: (scheduleId: string) => Promise<void>;
  onToggleClosed?: (scheduleId: string, isClosed: boolean) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
  onRemoveMember?: (scheduleId: string, characterId: string) => Promise<void>;
  onAddMemberDirectly?: (scheduleId: string, nickname: string, job: string) => Promise<void>;
  onUpdateMemberJob?: (scheduleId: string, characterId: string, newJob: JobClass) => Promise<void>;
  onUpdateLeaderJob?: (scheduleId: string, newJob: JobClass) => Promise<void>;
  onUpdateLeaderNickname?: (scheduleId: string, newNickname: string) => Promise<void>;
  onUpdateMemberNickname?: (scheduleId: string, characterId: string, newNickname: string) => Promise<void>;
  onEditSchedule?: (scheduleId: string, updates: ScheduleEditData) => Promise<void>;
  onCopySchedule?: (schedule: Schedule, includeMembers: boolean) => void;
  searchHighlight?: string; // 검색어 강조 표시용
  availableCharacters?: Character[]; // 등록된 캐릭터 목록 (파티원 추가 시 선택용)
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onJoin,
  onLeave,
  onToggleClosed,
  onDelete,
  onRemoveMember,
  onAddMemberDirectly,
  onUpdateMemberJob,
  onUpdateLeaderJob,
  onUpdateLeaderNickname,
  onUpdateMemberNickname,
  onEditSchedule,
  onCopySchedule,
  searchHighlight,
  availableCharacters,
}) => {
  const { selectedCharacter } = useUser();
  const { user, isGuest } = useAuth();
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberNickname, setNewMemberNickname] = useState('');
  const [newMemberJob, setNewMemberJob] = useState<string>('미정');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberNicknameId, setEditingMemberNicknameId] = useState<string | null>(null);
  const [editingMemberNickname, setEditingMemberNickname] = useState('');
  const [editingLeaderJob, setEditingLeaderJob] = useState(false);
  const [editingLeaderNickname, setEditingLeaderNickname] = useState(false);
  const [leaderNicknameInput, setLeaderNicknameInput] = useState('');
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCharacterSuggestions, setShowCharacterSuggestions] = useState(false);
  const [selectedCharacterJobs, setSelectedCharacterJobs] = useState<JobClass[]>([]);
  const [editFormData, setEditFormData] = useState<ScheduleEditData>({
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    maxMembers: schedule.maxMembers,
    note: schedule.note || '',
    difficulty: schedule.difficulty,
  });

  // 파티원 추가 시 등록된 캐릭터 필터링 (이미 파티에 있는 멤버 제외)
  const filteredCharacters = useMemo(() => {
    if (!availableCharacters || !newMemberNickname.trim()) return [];

    const existingNicknames = [
      schedule.leaderNickname.split(' (')[0],
      ...(schedule.members?.map(m => m.nickname) || [])
    ];

    return availableCharacters
      .filter(char =>
        !existingNicknames.includes(char.nickname) &&
        char.nickname.toLowerCase().includes(newMemberNickname.toLowerCase())
      )
      .slice(0, 5); // 최대 5개만 표시
  }, [availableCharacters, newMemberNickname, schedule.leaderNickname, schedule.members]);

  // 캐릭터 선택 시 처리
  const handleSelectCharacter = (character: Character) => {
    setNewMemberNickname(character.nickname);
    setSelectedCharacterJobs(character.jobs);
    setShowCharacterSuggestions(false);
    // 첫 번째 직업을 기본 선택 (있으면)
    if (character.jobs.length > 0) {
      setNewMemberJob(character.jobs[0]);
    }
  };

  const isAdmin = user?.role === 'admin';

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
  const isCreator = user?.id === schedule.createdBy; // 일정 생성자 확인
  // 멤버 여부 확인 (ID 또는 닉네임으로 매칭)
  const isMember = schedule.members?.some(
    (m) => m.characterId === selectedCharacter?.id ||
           (selectedCharacter?.nickname && m.nickname === selectedCharacter.nickname)
  );
  // 파티장 닉네임 매칭 (타인이 등록한 경우)
  const isLeaderByNickname = selectedCharacter?.nickname &&
    schedule.leaderNickname.split(' (')[0] === selectedCharacter.nickname;
  const currentCount = (schedule.members?.length || 0) + 1; // 파티장 포함
  const isFull = currentCount >= schedule.maxMembers;
  const isEffectivelyClosed = schedule.isClosed || isPastSchedule; // 지난 일정은 자동 마감
  const canEdit = isAdmin || isLeader || isCreator; // 수정 권한: 관리자, 파티장, 생성자
  const isRecruiting = !schedule.isClosed && !isPastSchedule && !isFull; // 모집중 여부

  // 파티원 가나다순 정렬
  const sortedMembers = schedule.members ? [...schedule.members].sort((a, b) =>
    a.nickname.localeCompare(b.nickname, 'ko')
  ) : [];

  // 검색어 강조 함수
  const highlightText = (text: string) => {
    if (!searchHighlight || !searchHighlight.trim()) return text;
    const regex = new RegExp(`(${searchHighlight.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

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

  const handleAddMember = async () => {
    if (!onAddMemberDirectly) return;
    if (!newMemberNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await onAddMemberDirectly(schedule.id, newMemberNickname.trim(), newMemberJob || '미정');
      setNewMemberNickname('');
      setNewMemberJob('미정');
      setShowAddMember(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '멤버 추가 실패');
    } finally {
      setLoading(false);
    }
  };

  // 파티장 직업 수정
  const handleUpdateLeaderJob = async (newJob: JobClass) => {
    if (!onUpdateLeaderJob) return;
    setLoading(true);
    try {
      await onUpdateLeaderJob(schedule.id, newJob);
      setEditingLeaderJob(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '직업 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  // 파티장 닉네임 수정
  const handleUpdateLeaderNickname = async () => {
    if (!onUpdateLeaderNickname || !leaderNicknameInput.trim()) return;
    setLoading(true);
    try {
      await onUpdateLeaderNickname(schedule.id, leaderNicknameInput.trim());
      setEditingLeaderNickname(false);
      setLeaderNicknameInput('');
    } catch (error) {
      alert(error instanceof Error ? error.message : '닉네임 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  // 파티원 닉네임 수정
  const handleUpdateMemberNickname = async (characterId: string) => {
    if (!onUpdateMemberNickname || !editingMemberNickname.trim()) return;
    setLoading(true);
    try {
      await onUpdateMemberNickname(schedule.id, characterId, editingMemberNickname.trim());
      setEditingMemberNicknameId(null);
      setEditingMemberNickname('');
    } catch (error) {
      alert(error instanceof Error ? error.message : '닉네임 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditForm = () => {
    setEditFormData({
      title: schedule.title,
      date: schedule.date,
      time: schedule.time,
      maxMembers: schedule.maxMembers,
      note: schedule.note || '',
      difficulty: schedule.difficulty,
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async () => {
    if (!onEditSchedule) return;
    if (!editFormData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await onEditSchedule(schedule.id, editFormData);
      setShowEditForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '수정 실패');
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
        <div className="schedule-content-name">
          {schedule.contentName}
        </div>
        {schedule.difficulty && (
          <div className="schedule-difficulty-badge" data-difficulty={schedule.difficulty}>
            {schedule.difficulty}
          </div>
        )}
        {schedule.isClosed && <span className="closed-badge">마감</span>}
        {isRecruiting && <span className="recruiting-badge">모집중</span>}
      </div>

      <div className="schedule-date-time-row">
        <span className="date-label">{formatDateLabel()}</span>
        <span className="time">{schedule.time}</span>
      </div>

      <h3 className="schedule-title">{schedule.title}</h3>

      <div className="schedule-info">
        <div className="leader-info">
          <span className="label">파티장</span>
          <span className={`value ${isLeaderByNickname ? 'my-nickname' : ''}`}>
            {editingLeaderNickname && canEdit && onUpdateLeaderNickname ? (
              <span className="nickname-edit-container">
                <input
                  type="text"
                  className="nickname-edit-input"
                  value={leaderNicknameInput}
                  onChange={(e) => setLeaderNicknameInput(e.target.value)}
                  placeholder="새 닉네임"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateLeaderNickname();
                    if (e.key === 'Escape') {
                      setEditingLeaderNickname(false);
                      setLeaderNicknameInput('');
                    }
                  }}
                />
                <button
                  className="nickname-edit-btn save"
                  onClick={handleUpdateLeaderNickname}
                  disabled={loading}
                >
                  ✓
                </button>
                <button
                  className="nickname-edit-btn cancel"
                  onClick={() => {
                    setEditingLeaderNickname(false);
                    setLeaderNicknameInput('');
                  }}
                >
                  ✕
                </button>
              </span>
            ) : (
              <span
                className={canEdit && onUpdateLeaderNickname ? 'editable-nickname' : ''}
                onClick={() => {
                  if (canEdit && onUpdateLeaderNickname) {
                    setLeaderNicknameInput(schedule.leaderNickname.split(' (')[0]);
                    setEditingLeaderNickname(true);
                  }
                }}
                title={canEdit && onUpdateLeaderNickname ? '클릭하여 닉네임 변경' : ''}
              >
                {highlightText(schedule.leaderNickname.split(' (')[0])}
              </span>
            )}
            {editingLeaderJob && canEdit && onUpdateLeaderJob ? (
              <select
                className="job-edit-select"
                value={schedule.leaderJob || '미정'}
                onChange={(e) => handleUpdateLeaderJob(e.target.value as JobClass)}
                autoFocus
                onBlur={() => setEditingLeaderJob(false)}
              >
                <option value="미정">미정</option>
                {JOB_LIST.map((job) => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            ) : (
              <small
                className={canEdit && onUpdateLeaderJob ? 'editable-job' : ''}
                onClick={() => canEdit && onUpdateLeaderJob && setEditingLeaderJob(true)}
                title={canEdit && onUpdateLeaderJob ? '클릭하여 직업 변경' : ''}
              >
                ({schedule.leaderJob || '미정'})
              </small>
            )}
          </span>
        </div>
        <div className="member-count">
          <span className="label">인원</span>
          <span className={`value ${isFull ? 'full' : ''}`}>
            {currentCount}/{schedule.maxMembers}
          </span>
        </div>
      </div>

      {sortedMembers.length > 0 && (
        <div className="members-list">
          <span className="label">참여자</span>
          <div className="members">
            {sortedMembers.map((member, idx) => {
              // ID 또는 닉네임으로 본인 여부 확인
              const isMyMember = member.characterId === selectedCharacter?.id ||
                (selectedCharacter?.nickname && member.nickname === selectedCharacter.nickname);
              // 본인 또는 수정권한자는 직업 수정 가능
              const canEditMemberJob = (isMyMember || canEdit) && onUpdateMemberJob;
              const canEditMemberNickname = canEdit && onUpdateMemberNickname;
              const isEditingJob = editingMemberId === member.characterId;
              const isEditingNickname = editingMemberNicknameId === member.characterId;

              return (
                <span key={idx} className={`member-tag ${isMyMember ? 'my-nickname' : ''}`}>
                  {isEditingNickname ? (
                    <span className="nickname-edit-container inline">
                      <input
                        type="text"
                        className="nickname-edit-input small"
                        value={editingMemberNickname}
                        onChange={(e) => setEditingMemberNickname(e.target.value)}
                        placeholder="새 닉네임"
                        maxLength={20}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateMemberNickname(member.characterId);
                          if (e.key === 'Escape') {
                            setEditingMemberNicknameId(null);
                            setEditingMemberNickname('');
                          }
                        }}
                      />
                      <button
                        className="nickname-edit-btn save small"
                        onClick={() => handleUpdateMemberNickname(member.characterId)}
                        disabled={loading}
                      >
                        ✓
                      </button>
                      <button
                        className="nickname-edit-btn cancel small"
                        onClick={() => {
                          setEditingMemberNicknameId(null);
                          setEditingMemberNickname('');
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ) : (
                    <span
                      className={canEditMemberNickname ? 'editable-nickname' : ''}
                      onClick={() => {
                        if (canEditMemberNickname) {
                          setEditingMemberNickname(member.nickname);
                          setEditingMemberNicknameId(member.characterId);
                        }
                      }}
                      title={canEditMemberNickname ? '클릭하여 닉네임 변경' : ''}
                    >
                      {highlightText(member.nickname)}
                    </span>
                  )}
                  {isEditingJob ? (
                    <select
                      className="job-edit-select"
                      value={member.job}
                      onChange={async (e) => {
                        const newJob = e.target.value as JobClass;
                        if (newJob && onUpdateMemberJob) {
                          await onUpdateMemberJob(schedule.id, member.characterId, newJob);
                        }
                        setEditingMemberId(null);
                      }}
                      autoFocus
                      onBlur={() => setEditingMemberId(null)}
                    >
                      <option value="미정">미정</option>
                      {JOB_LIST.map((job) => (
                        <option key={job} value={job}>
                          {job}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <small
                        className={canEditMemberJob ? 'editable-job' : ''}
                        onClick={() => canEditMemberJob && setEditingMemberId(member.characterId)}
                        title={canEditMemberJob ? '클릭하여 직업 변경' : ''}
                      >
                        ({member.job})
                      </small>
                    </>
                  )}
                  {canEdit && onRemoveMember && !isEditingJob && !isEditingNickname && (
                    <button
                      className="member-remove-btn"
                      onClick={() => {
                        if (confirm(`${member.nickname}님을 파티에서 제외하시겠습니까?`)) {
                          onRemoveMember(schedule.id, member.characterId);
                        }
                      }}
                      disabled={loading}
                      title="파티원 제거"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {schedule.note && (
        <div className="schedule-note">
          <span className="label">비고</span>
          <span className="value">{schedule.note}</span>
        </div>
      )}

      {/* 일정 수정 폼 (관리자/파티장용) - 관리자는 캐릭터 없이도 가능 */}
      {canEdit && showEditForm && onEditSchedule && (
        <div className="edit-schedule-form">
          <div className="edit-form-header">
            <span className="label">일정 수정</span>
            <button
              className="close-btn"
              onClick={() => setShowEditForm(false)}
            >
              ×
            </button>
          </div>
          <div className="edit-form-body">
            <div className="edit-form-group">
              <label>제목</label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="edit-form-input"
                maxLength={50}
              />
            </div>
            <div className="edit-form-row">
              <div className="edit-form-group">
                <label>날짜</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="edit-form-input"
                />
              </div>
              <div className="edit-form-group">
                <label>시간</label>
                <input
                  type="time"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  className="edit-form-input"
                />
              </div>
            </div>
            <div className="edit-form-row">
              <div className="edit-form-group">
                <label>최대 인원</label>
                <select
                  value={editFormData.maxMembers}
                  onChange={(e) => setEditFormData({ ...editFormData, maxMembers: Number(e.target.value) })}
                  className="edit-form-input"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </div>
              <div className="edit-form-group">
                <label>난이도</label>
                <select
                  value={editFormData.difficulty}
                  onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as DifficultyType })}
                  className="edit-form-input"
                >
                  {DIFFICULTY_LIST.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="edit-form-group">
              <label>비고</label>
              <input
                type="text"
                value={editFormData.note}
                onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                className="edit-form-input"
                placeholder="선택사항"
                maxLength={100}
              />
            </div>
            <div className="edit-form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditForm(false)}
                disabled={loading}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSubmit}
                disabled={loading}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 파티원 직접 추가 폼 (관리자/파티장용) - 관리자는 캐릭터 없이도 가능 */}
      {canEdit && showAddMember && onAddMemberDirectly && !isFull && (
        <div className="add-member-form">
          <div className="add-member-header">
            <span className="label">파티원 직접 추가</span>
            <button
              className="close-btn"
              onClick={() => {
                setShowAddMember(false);
                setSelectedCharacterJobs([]);
              }}
            >
              ×
            </button>
          </div>
          <div className="add-member-inputs">
            <div className="nickname-input-container">
              <input
                type="text"
                value={newMemberNickname}
                onChange={(e) => {
                  setNewMemberNickname(e.target.value);
                  setShowCharacterSuggestions(true);
                  setSelectedCharacterJobs([]);
                }}
                onFocus={() => setShowCharacterSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCharacterSuggestions(false), 200)}
                placeholder="닉네임 (검색 또는 직접 입력)"
                className="add-member-input"
                maxLength={20}
              />
              {showCharacterSuggestions && filteredCharacters.length > 0 && (
                <div className="character-suggestions">
                  {filteredCharacters.map((char) => (
                    <div
                      key={char.id}
                      className="character-suggestion-item"
                      onMouseDown={() => handleSelectCharacter(char)}
                    >
                      <span className="char-nickname">{char.nickname}</span>
                      <span className="char-jobs">{char.jobs.slice(0, 3).join(', ')}{char.jobs.length > 3 ? '...' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select
              value={newMemberJob}
              onChange={(e) => setNewMemberJob(e.target.value)}
              className="add-member-select"
            >
              <option value="미정">미정</option>
              {selectedCharacterJobs.length > 0 ? (
                <>
                  <optgroup label="선택된 캐릭터 직업">
                    {selectedCharacterJobs.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="전체 직업">
                    {JOB_LIST.filter(job => !selectedCharacterJobs.includes(job)).map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : (
                JOB_LIST.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))
              )}
            </select>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddMember}
              disabled={loading}
            >
              추가
            </button>
          </div>
        </div>
      )}

      <div className="schedule-actions">
        {/* 복사 버튼 - 회원 사용자만 가능 */}
        {onCopySchedule && !isGuest && (
          <div className="copy-btn-container">
            <button
              className="btn btn-outline"
              onClick={() => setShowCopyOptions(!showCopyOptions)}
              disabled={loading}
              title="일정 복사"
            >
              복사
            </button>
            {showCopyOptions && (
              <div className="copy-options">
                <button
                  className="copy-option-btn"
                  onClick={() => {
                    onCopySchedule(schedule, false);
                    setShowCopyOptions(false);
                  }}
                >
                  일정만 복사
                </button>
                <button
                  className="copy-option-btn"
                  onClick={() => {
                    onCopySchedule(schedule, true);
                    setShowCopyOptions(false);
                  }}
                >
                  파티원 포함 복사
                </button>
              </div>
            )}
          </div>
        )}

        {/* 수정 권한이 있는 경우 (관리자, 파티장, 생성자) */}
        {canEdit ? (
          <>
            {onEditSchedule && (
              <button
                className="btn btn-info"
                onClick={handleOpenEditForm}
                disabled={loading}
              >
                수정
              </button>
            )}
            {!isFull && !isEffectivelyClosed && onAddMemberDirectly && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddMember(!showAddMember)}
                disabled={loading}
              >
                {showAddMember ? '취소' : '파티원 추가'}
              </button>
            )}
            {!isPastSchedule && (
              <button
                className="btn btn-secondary"
                onClick={handleToggleClosed}
                disabled={loading}
              >
                {schedule.isClosed ? '마감 해제' : '마감하기'}
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              삭제
            </button>
            {isAdmin && !isLeader && !isCreator && (
              <span className="admin-badge">관리자</span>
            )}
          </>
        ) : isGuest ? (
          <p className="no-character-msg">게스트는 일정 조회만 가능합니다</p>
        ) : !selectedCharacter ? (
          <p className="no-character-msg">캐릭터를 먼저 등록해주세요</p>
        ) : isMember || isLeaderByNickname ? (
          <button
            className="btn btn-danger"
            onClick={handleLeave}
            disabled={loading}
          >
            탈퇴하기
          </button>
        ) : isEffectivelyClosed || isFull ? (
          <button className="btn btn-disabled" disabled>
            {isPastSchedule ? '종료됨' : schedule.isClosed ? '마감됨' : '인원 마감'}
          </button>
        ) : showJobSelect ? (
          <div className="job-select-container">
            <select
              className="job-select"
              onChange={(e) => handleJoin(e.target.value as JobClass)}
              disabled={loading}
              defaultValue="미정"
            >
              <option value="미정">미정 (추후 결정)</option>
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
