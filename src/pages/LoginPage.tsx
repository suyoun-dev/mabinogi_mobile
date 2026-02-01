import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(code.trim().toUpperCase());
      if (user) {
        navigate('/');
      } else {
        setError('존재하지 않는 코드입니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateNickname = async (name: string): Promise<boolean> => {
    const users = await authService.getAllUsers();
    return users.some(user => user.nickname.toLowerCase() === name.toLowerCase());
  };

  const handleNicknameChange = async (value: string) => {
    setNickname(value);
    setNicknameError('');

    if (value.trim().length >= 2) {
      const isDuplicate = await checkDuplicateNickname(value.trim());
      if (isDuplicate) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    // 중복 닉네임 체크
    const isDuplicate = await checkDuplicateNickname(nickname.trim());
    if (isDuplicate) {
      setError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await register(nickname.trim());
      setNewUserCode(user.code);
      setShowCodeModal(true);
    } catch (err) {
      setError('가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(newUserCode);
      alert('코드가 복사되었습니다!');
    } catch (err) {
      // 클립보드 API 실패 시 대체 방법
      const textArea = document.createElement('textarea');
      textArea.value = newUserCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('코드가 복사되었습니다!');
    }
  };

  const handleCloseModal = () => {
    setShowCodeModal(false);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img src="/saenyeok_title.png" alt="새녘" className="logo-image" />
        </div>
        <p className="login-subtitle">모비노기 어비스 & 레이드 파티 관리</p>

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            신규 가입
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>내 코드</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="form-input"
                placeholder="6자리 코드 입력"
                maxLength={10}
                autoComplete="off"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p className="hint">
              관리자는 관리자 코드를 입력하세요.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label>닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className={`form-input ${nicknameError ? 'input-error' : ''}`}
                placeholder="사용할 닉네임"
                maxLength={20}
              />
              {nicknameError && <span className="field-error">{nicknameError}</span>}
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading || !!nicknameError}>
              {loading ? '가입 중...' : '가입하고 코드 받기'}
            </button>

            <p className="hint">
              가입 후 발급되는 코드를 잘 보관하세요.<br />
              다음 로그인 시 필요합니다.
            </p>
          </form>
        )}
      </div>

      {/* 코드 발급 모달 */}
      {showCodeModal && (
        <div className="code-modal-overlay" onClick={handleCloseModal}>
          <div className="code-modal" onClick={(e) => e.stopPropagation()}>
            <h3>가입 완료!</h3>
            <p className="code-label">내 입장 코드</p>
            <div className="code-display">
              <span className="code-text">{newUserCode}</span>
              <button className="btn-copy" onClick={handleCopyCode}>
                복사
              </button>
            </div>
            <p className="code-warning">
              이 코드를 잘 보관하세요!<br />
              다음 로그인 시 필요합니다.
            </p>
            <button className="btn btn-primary" onClick={handleCloseModal}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
