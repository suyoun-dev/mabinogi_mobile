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
  const [newEventEndTime, setNewEventEndTime] = useState('23:59');
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToEvents((data) => {
      setEvents(data);
    });
    return () => unsubscribe();
  }, []);

  // 남은 시간 계산
  const getTimeLeft = (endDate: string, endTime: string): number => {
    const end = new Date(`${endDate}T${endTime || '23:59'}:00`);
    const now = new Date();
    return end.getTime() - now.getTime();
  };

  // 남은 일수
  const getDaysLeft = (endDate: string, endTime: string): number => {
    const diff = getTimeLeft(endDate, endTime);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 남은 시간 텍스트
  const getDaysLeftText = (endDate: string, endTime: string): string => {
    const diff = getTimeLeft(endDate, endTime);
    if (diff < 0) return '종료됨';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}시간`;

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'D-Day';
    return `D-${days}`;
  };

  // 남은 일수 색상 클래스
  const getDaysLeftClass = (endDate: string, endTime: string): string => {
    const days = getDaysLeft(endDate, endTime);
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  // 진행중인 이벤트 수
  const activeEventCount = events.filter(e => getTimeLeft(e.endDate, e.endTime) >= 0).length;

  const handleAddEvent = async () => {
    if (!newEventName.trim() || !newEventEndDate) return;

    try {
      await createEvent({
        name: newEventName.trim(),
        endDate: newEventEndDate,
        endTime: newEventEndTime || '23:59',
      });

      setNewEventName('');
      setNewEventEndDate('');
      setNewEventEndTime('23:59');
      setShowAddForm(false);
    } catch (error) {
      console.error('이벤트 등록 실패:', error);
      alert('이벤트 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('이 이벤트를 삭제하시겠습니까?')) return;
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('이벤트 삭제 실패:', error);
      alert('이벤트 삭제에 실패했습니다.');
    }
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
                  const daysClass = getDaysLeftClass(event.endDate, event.endTime);
                  return (
                    <li key={event.id} className={`event-item ${daysClass}`}>
                      <div className="event-info">
                        <span className="event-name">{event.name}</span>
                        <span className="event-date">
                          ~ {event.endDate.replace(/-/g, '.')} {event.endTime || '23:59'}
                        </span>
                      </div>
                      <div className="event-right">
                        <span className={`event-dday ${daysClass}`}>
                          {getDaysLeftText(event.endDate, event.endTime)}
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
                    <div className="event-datetime-row">
                      <input
                        type="date"
                        className="event-input event-date-input"
                        value={newEventEndDate}
                        onChange={(e) => setNewEventEndDate(e.target.value)}
                        min={today}
                      />
                      <input
                        type="time"
                        className="event-input event-time-input"
                        value={newEventEndTime}
                        onChange={(e) => setNewEventEndTime(e.target.value)}
                      />
                    </div>
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
                          setNewEventEndTime('23:59');
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
