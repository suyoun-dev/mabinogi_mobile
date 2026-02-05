import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToEvents, createEvent, deleteEvent } from '../services/eventService';
import type { GameEvent } from '../types';
import './EventPopup.css';

const EventPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToEvents((data) => {
      setEvents(data);
    });
    return () => unsubscribe();
  }, []);

  // 남은 일수 계산
  const getDaysLeft = (endDate: string): number => {
    const end = new Date(endDate + 'T23:59:59');
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 남은 일수 텍스트
  const getDaysLeftText = (endDate: string): string => {
    const days = getDaysLeft(endDate);
    if (days < 0) return '종료됨';
    if (days === 0) return 'D-Day';
    return `D-${days}`;
  };

  // 남은 일수 색상 클래스
  const getDaysLeftClass = (endDate: string): string => {
    const days = getDaysLeft(endDate);
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  // 진행중인 이벤트 수
  const activeEventCount = events.filter(e => getDaysLeft(e.endDate) >= 0).length;

  const handleAddEvent = async () => {
    if (!newEventName.trim() || !newEventEndDate) return;

    await createEvent({
      name: newEventName.trim(),
      endDate: newEventEndDate,
    });

    setNewEventName('');
    setNewEventEndDate('');
    setShowAddForm(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('이 이벤트를 삭제하시겠습니까?')) return;
    await deleteEvent(eventId);
  };

  // 오늘 날짜 (최소 날짜 설정용)
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* 이벤트 버튼 */}
      <button
        className="event-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="진행중인 이벤트"
      >
        {isOpen ? '✕' : '!'}
        {!isOpen && activeEventCount > 0 && (
          <span className="event-badge">{activeEventCount}</span>
        )}
      </button>

      {/* 이벤트 팝업 */}
      {isOpen && (
        <div className="event-popup">
          <div className="event-popup-header">
            <h3>진행중인 이벤트</h3>
            <button className="event-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="event-popup-content">
            {events.length === 0 ? (
              <p className="event-empty">등록된 이벤트가 없습니다.</p>
            ) : (
              <ul className="event-list">
                {events.map((event) => {
                  const daysClass = getDaysLeftClass(event.endDate);
                  return (
                    <li key={event.id} className={`event-item ${daysClass}`}>
                      <div className="event-info">
                        <span className="event-name">{event.name}</span>
                        <span className="event-date">
                          ~ {event.endDate.replace(/-/g, '.')}
                        </span>
                      </div>
                      <div className="event-right">
                        <span className={`event-dday ${daysClass}`}>
                          {getDaysLeftText(event.endDate)}
                        </span>
                        {isAdmin && (
                          <button
                            className="event-delete-btn"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="삭제"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* 관리자 - 이벤트 추가 */}
            {isAdmin && (
              <div className="event-admin">
                {showAddForm ? (
                  <div className="event-add-form">
                    <input
                      type="text"
                      className="event-input"
                      placeholder="이벤트 이름"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      maxLength={50}
                    />
                    <input
                      type="date"
                      className="event-input event-date-input"
                      value={newEventEndDate}
                      onChange={(e) => setNewEventEndDate(e.target.value)}
                      min={today}
                    />
                    <div className="event-form-actions">
                      <button
                        className="event-btn event-btn-confirm"
                        onClick={handleAddEvent}
                        disabled={!newEventName.trim() || !newEventEndDate}
                      >
                        등록
                      </button>
                      <button
                        className="event-btn event-btn-cancel"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewEventName('');
                          setNewEventEndDate('');
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="event-btn event-btn-add"
                    onClick={() => setShowAddForm(true)}
                  >
                    + 이벤트 추가
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isOpen && <div className="event-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default EventPopup;
