import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await register(nickname.trim());
      alert(`가입 완료! 내 코드: ${user.code}\n\n이 코드를 잘 보관하세요. 다음 로그인 시 필요합니다.`);
      navigate('/');
    } catch (err) {
      setError('가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">새녘 스케줄러</h1>
        <p className="login-subtitle">어비스 & 레이드 파티 관리</p>

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
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                placeholder="사용할 닉네임"
                maxLength={20}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '가입 중...' : '가입하고 코드 받기'}
            </button>

            <p className="hint">
              가입 후 발급되는 코드를 잘 보관하세요.<br />
              다음 로그인 시 필요합니다.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
