import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const { selectedCharacter } = useUser();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="logo">
          마비노기M 일정
        </Link>
        {selectedCharacter && (
          <Link to="/characters" className="current-character">
            {selectedCharacter.nickname}
          </Link>
        )}
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
      </nav>
    </header>
  );
};

export default Header;
