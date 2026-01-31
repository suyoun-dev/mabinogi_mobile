import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import type { UserAccount } from '../types';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNickname, setNewNickname] = useState('');
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="page admin-page">
      <h2 className="page-title">관리자 페이지</h2>

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
              <div key={u.id} className={`user-card ${u.role === 'admin' ? 'admin' : ''}`}>
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
                {u.role !== 'admin' && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteUser(u)}
                  >
                    삭제
                  </button>
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
