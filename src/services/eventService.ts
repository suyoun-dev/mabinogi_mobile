import {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  off,
} from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import type { GameEvent } from '../types';

const EVENTS_REF = 'events';

// 이벤트 생성
export const createEvent = async (
  event: Omit<GameEvent, 'id' | 'createdAt'>
): Promise<string> => {
  const eventsRef = ref(database, EVENTS_REF);
  const newEventRef = push(eventsRef);

  const newEvent: GameEvent = {
    ...event,
    id: newEventRef.key!,
    createdAt: Date.now(),
  };

  await set(newEventRef, newEvent);
  return newEventRef.key!;
};

// 이벤트 수정
export const updateEvent = async (
  eventId: string,
  updates: Partial<Pick<GameEvent, 'name' | 'endDate' | 'endTime'>>
): Promise<void> => {
  const eventRef = ref(database, `${EVENTS_REF}/${eventId}`);
  await update(eventRef, updates);
};

// 이벤트 삭제
export const deleteEvent = async (eventId: string): Promise<void> => {
  const eventRef = ref(database, `${EVENTS_REF}/${eventId}`);
  await remove(eventRef);
};

// 만료된 이벤트 자동 삭제
const deleteExpiredEvents = (events: GameEvent[]) => {
  const now = new Date();
  events.forEach((event) => {
    const end = new Date(`${event.endDate}T${event.endTime || '23:59'}:00`);
    const diff = end.getTime() - now.getTime();
    // 종료 후 24시간이 지난 이벤트 자동 삭제
    if (diff < -(24 * 60 * 60 * 1000)) {
      deleteEvent(event.id).catch((err) =>
        console.error('만료 이벤트 삭제 실패:', err)
      );
    }
  });
};

// 이벤트 실시간 구독
export const subscribeToEvents = (
  callback: (events: GameEvent[]) => void
): (() => void) => {
  const eventsRef = ref(database, EVENTS_REF);

  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const events: GameEvent[] = [];
    snapshot.forEach((child) => {
      events.push(child.val() as GameEvent);
    });

    // 만료된 이벤트 자동 삭제
    deleteExpiredEvents(events);

    // 삭제 대상 제외하고 콜백 전달 (종료 후 24시간 이내는 표시)
    const now = new Date();
    const activeEvents = events.filter((event) => {
      const end = new Date(`${event.endDate}T${event.endTime || '23:59'}:00`);
      return end.getTime() - now.getTime() >= -(24 * 60 * 60 * 1000);
    });

    // 종료일 기준 오름차순 정렬
    activeEvents.sort((a, b) => a.endDate.localeCompare(b.endDate));
    callback(activeEvents);
  };

  onValue(eventsRef, handleValue);
  return () => off(eventsRef, 'value', handleValue);
};
