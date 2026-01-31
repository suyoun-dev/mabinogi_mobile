import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCharacter } = useUser();
  const { user, isAdmin, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="logo">
          새녘 스케줄러
        </Link>
        <div className="header-right">
          {user && (
            <span className="user-info">
              {user.nickname}
              {isAdmin && <span className="admin-tag">관리자</span>}
            </span>
          )}
          {selectedCharacter && (
            <Link to="/characters" className="current-character">
              {selectedCharacter.nickname}
            </Link>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
      <nav className="nav">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          일정
        </Link>
        <Link to="/create" className={`nav-item ${isActive('/create') ? 'active' : ''}`}>
          등록
        </Link>
        <Link to="/my-schedule" className={`nav-item ${isActive('/my-schedule') ? 'active' : ''}`}>
          내 일정
        </Link>
        <Link to="/characters" className={`nav-item ${isActive('/characters') ? 'active' : ''}`}>
          캐릭터
        </Link>
        {isAdmin && (
          <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
            관리
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
