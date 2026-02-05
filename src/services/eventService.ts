import {
  ref,
  push,
  set,
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

// 이벤트 삭제
export const deleteEvent = async (eventId: string): Promise<void> => {
  const eventRef = ref(database, `${EVENTS_REF}/${eventId}`);
  await remove(eventRef);
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

    // 종료일 기준 오름차순 정렬
    events.sort((a, b) => a.endDate.localeCompare(b.endDate));
    callback(events);
  };

  onValue(eventsRef, handleValue);
  return () => off(eventsRef, 'value', handleValue);
};
