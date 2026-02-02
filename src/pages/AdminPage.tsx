import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../hooks/useSchedules';
import * as authService from '../services/authService';
import * as characterService from '../services/characterService';
import type { UserAccount, Character, ContentType, DifficultyType, JobClass, PartyMember } from '../types';
import { CONTENT_LIST } from '../types';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { deletePastSchedules, createSchedule } = useSchedules();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNickname, setNewNickname] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingPast, setDeletingPast] = useState(false);

  // 캐릭터 조회 관련
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);

  // 엑셀 업로드 관련
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    setCreating(true);
    try {
      const newUser = await authService.createUser(newNickname.trim(), false);
      alert(`사용자 생성 완료!\n\n닉네임: ${newUser.nickname}\n코드: ${newUser.code}`);
      setNewNickname('');
      loadUsers();
    } catch (error) {
      alert('사용자 생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (targetUser: UserAccount) => {
    if (targetUser.id === user?.id) {
      alert('자신의 계정은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`'${targetUser.nickname}' 사용자를 삭제하시겠습니까?\n코드: ${targetUser.code}`)) {
      return;
    }

    try {
      await authService.deleteUser(targetUser.id);
      loadUsers();
    } catch (error) {
      alert('사용자 삭제 실패');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`코드가 복사되었습니다: ${code}`);
  };

  const handleDeletePastSchedules = async () => {
    if (!confirm('지나간 모든 일정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setDeletingPast(true);
    try {
      const count = await deletePastSchedules();
      alert(`${count}개의 지나간 일정이 삭제되었습니다.`);
    } catch (error) {
      alert('일정 삭제 실패');
    } finally {
      setDeletingPast(false);
    }
  };

  // 사용자 캐릭터 조회
  const handleViewCharacters = async (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setUserCharacters([]);
      return;
    }

    setSelectedUserId(userId);
    setLoadingChars(true);
    try {
      const chars = await characterService.getCharactersByUserId(userId);
      setUserCharacters(chars);
    } catch (error) {
      alert('캐릭터 조회 실패');
      setUserCharacters([]);
    } finally {
      setLoadingChars(false);
    }
  };

  // 엑셀/CSV 파일 업로드 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingExcel(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('데이터가 없습니다. 헤더와 데이터를 포함해주세요.');
        return;
      }

      // CSV 파싱 (헤더: 날짜,시간,종류,컨텐츠,난이도,제목,최대인원,파티장,파티장직업,비고,파티원)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dateIdx = headers.findIndex(h => h.includes('날짜') || h === 'date');
      const timeIdx = headers.findIndex(h => h.includes('시간') || h === 'time');
      const typeIdx = headers.findIndex(h => h.includes('종류') || h === 'type');
      const contentIdx = headers.findIndex(h => h.includes('컨텐츠') || h === 'content');
      const diffIdx = headers.findIndex(h => h.includes('난이도') || h === 'difficulty');
      const titleIdx = headers.findIndex(h => h.includes('제목') || h === 'title');
      const maxIdx = headers.findIndex(h => h.includes('인원') || h === 'max');
      const leaderIdx = headers.findIndex(h => h.includes('파티장') || h === 'leader');
      const jobIdx = headers.findIndex(h => h.includes('직업') || h === 'job');
      const noteIdx = headers.findIndex(h => h.includes('비고') || h === 'note');
      const membersIdx = headers.findIndex(h => h.includes('파티원') || h === 'members');

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());

        try {
          const date = cols[dateIdx] || '';
          const time = cols[timeIdx] || '21:00';
          const type = (cols[typeIdx] as ContentType) || '어비스';
          const contentName = cols[contentIdx] || CONTENT_LIST[type][0];
          const difficulty = (cols[diffIdx] as DifficultyType) || '어려움';
          const title = cols[titleIdx] || `${contentName} ${difficulty}`;
          const maxMembers = parseInt(cols[maxIdx]) || 8;
          const leaderNickname = cols[leaderIdx] || '미정';
          const leaderJob = (cols[jobIdx] as JobClass) || '미정';
          const note = cols[noteIdx] || '';

          // 파티원 파싱 (닉네임:직업 형식, | 구분)
          const membersStr = membersIdx >= 0 ? cols[membersIdx] : '';
          const members: PartyMember[] = [];
          if (membersStr) {
            const memberParts = membersStr.split('|');
            memberParts.forEach((part, idx) => {
              const [nickname, job] = part.split(':').map(s => s.trim());
              if (nickname) {
                members.push({
                  characterId: `csv_${Date.now()}_${i}_${idx}`,
                  nickname,
                  job: (job as JobClass) || '미정',
                  joinedAt: Date.now(),
                });
              }
            });
          }

          // 날짜 유효성 검사
          if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            errorCount++;
            continue;
          }

          await createSchedule({
            type,
            contentName,
            difficulty,
            title,
            date,
            time,
            maxMembers,
            note,
            isClosed: false,
            leaderId: `excel_${Date.now()}_${i}`,
            leaderNickname: `${leaderNickname} (${leaderJob})`,
            leaderJob,
            members,
            createdBy: user.id,
          });

          successCount++;
        } catch {
          errorCount++;
        }
      }

      alert(`업로드 완료!\n성공: ${successCount}개\n실패: ${errorCount}개`);
    } catch (error) {
      alert('파일 처리 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setUploadingExcel(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 샘플 CSV 다운로드
  const downloadSampleCsv = () => {
    const sample = `날짜,시간,종류,컨텐츠,난이도,제목,최대인원,파티장,파티장직업,비고,파티원
2026-02-01,21:00,어비스,바리 어비스,어려움,바리 1파티,8,파티장닉네임,전사,비고내용,멤버1:힐러|멤버2:궁수|멤버3:미정
2026-02-02,22:00,레이드,글라스기브넨,매우 어려움,글라스 2파티,8,파티장닉네임2,힐러,,`;

    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule_sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page admin-page">
      <h2 className="page-title">관리자 페이지</h2>

      <section className="admin-section">
        <h3>일정 관리</h3>
        <div className="schedule-management">
          <button
            className="btn btn-danger"
            onClick={handleDeletePastSchedules}
            disabled={deletingPast}
          >
            {deletingPast ? '삭제 중...' : '지나간 일정 모두 삭제'}
          </button>
          <p className="hint-text">* 현재 시간 기준 지나간 모든 일정을 삭제합니다.</p>
        </div>
      </section>

      <section className="admin-section">
        <h3>엑셀 일정 업로드</h3>
        <div className="excel-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <div className="excel-buttons">
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingExcel}
            >
              {uploadingExcel ? '업로드 중...' : 'CSV 파일 업로드'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={downloadSampleCsv}
            >
              샘플 CSV 다운로드
            </button>
          </div>
          <p className="hint-text">* CSV 형식으로 일정을 일괄 등록할 수 있습니다.</p>
          <p className="hint-text">* 날짜 형식: YYYY-MM-DD (예: 2026-02-01)</p>
          <p className="hint-text">* 파티원 형식: 닉네임:직업|닉네임:직업 (예: 멤버1:힐러|멤버2:궁수)</p>
        </div>
      </section>

      <section className="admin-section">
        <h3>새 사용자 생성</h3>
        <form onSubmit={handleCreateUser} className="create-user-form">
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            className="form-input"
            placeholder="닉네임 입력"
            maxLength={20}
          />
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? '생성 중...' : '사용자 생성'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h3>사용자 목록 ({users.length}명)</h3>
        {loading ? (
          <p className="loading-text">로딩 중...</p>
        ) : users.length === 0 ? (
          <p className="empty-text">등록된 사용자가 없습니다.</p>
        ) : (
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-card-wrapper">
                <div className={`user-card ${u.role === 'admin' ? 'admin' : ''}`}>
                  <div className="user-info">
                    <div className="user-header">
                      <span className="user-nickname">{u.nickname}</span>
                      {u.role === 'admin' && <span className="admin-badge">관리자</span>}
                    </div>
                    <div className="user-code" onClick={() => copyCode(u.code)}>
                      코드: <strong>{u.code}</strong>
                      <span className="copy-hint">(클릭하여 복사)</span>
                    </div>
                    <div className="user-date">
                      가입: {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn btn-info btn-small"
                      onClick={() => handleViewCharacters(u.id)}
                    >
                      {selectedUserId === u.id ? '접기' : '캐릭터'}
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteUser(u)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                {/* 캐릭터 목록 표시 */}
                {selectedUserId === u.id && (
                  <div className="user-characters">
                    {loadingChars ? (
                      <p className="loading-text">캐릭터 로딩 중...</p>
                    ) : userCharacters.length === 0 ? (
                      <p className="empty-text">등록된 캐릭터가 없습니다.</p>
                    ) : (
                      <div className="character-list">
                        {userCharacters.map((char) => (
                          <div key={char.id} className="character-item">
                            <span className="char-nickname">{char.nickname}</span>
                            <span className="char-jobs">
                              {char.jobs.join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
