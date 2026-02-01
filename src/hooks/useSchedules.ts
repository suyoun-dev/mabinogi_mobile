import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '../types';
import * as scheduleService from '../services/scheduleService';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = scheduleService.subscribeToSchedules((data) => {
      setSchedules(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createSchedule = useCallback(
    async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);
        const id = await scheduleService.createSchedule(schedule);
        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : '일정 생성 실패');
        throw err;
      }
    },
    []
  );

  const updateSchedule = useCallback(
    async (id: string, updates: Partial<Schedule>) => {
      try {
        setError(null);
        await scheduleService.updateSchedule(id, updates);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일정 수정 실패');
        throw err;
      }
    },
    []
  );

  const deleteSchedule = useCallback(async (id: string) => {
    try {
      setError(null);
      await scheduleService.deleteSchedule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '일정 삭제 실패');
      throw err;
    }
  }, []);

  const joinParty = useCallback(
    async (scheduleId: string, member: Parameters<typeof scheduleService.joinParty>[1]) => {
      try {
        setError(null);
        await scheduleService.joinParty(scheduleId, member);
      } catch (err) {
        setError(err instanceof Error ? err.message : '파티 참여 실패');
        throw err;
      }
    },
    []
  );

  const leaveParty = useCallback(async (scheduleId: string, characterId: string) => {
    try {
      setError(null);
      await scheduleService.leaveParty(scheduleId, characterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파티 탈퇴 실패');
      throw err;
    }
  }, []);

  const toggleClosed = useCallback(async (scheduleId: string, isClosed: boolean) => {
    try {
      setError(null);
      await scheduleService.togglePartyClosed(scheduleId, isClosed);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마감 상태 변경 실패');
      throw err;
    }
  }, []);

  const getMySchedules = useCallback(
    (characterId: string) => {
      return scheduleService.getMySchedules(schedules, characterId);
    },
    [schedules]
  );

  const removeMember = useCallback(
    async (scheduleId: string, characterId: string) => {
      try {
        setError(null);
        await scheduleService.removeMember(scheduleId, characterId);
      } catch (err) {
        setError(err instanceof Error ? err.message : '멤버 제거 실패');
        throw err;
      }
    },
    []
  );

  const deletePastSchedules = useCallback(async () => {
    try {
      setError(null);
      const count = await scheduleService.deletePastSchedules();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : '지나간 일정 삭제 실패');
      throw err;
    }
  }, []);

  const addMemberDirectly = useCallback(
    async (scheduleId: string, nickname: string, job: string) => {
      try {
        setError(null);
        await scheduleService.addMemberDirectly(scheduleId, nickname, job);
      } catch (err) {
        setError(err instanceof Error ? err.message : '멤버 추가 실패');
        throw err;
      }
    },
    []
  );

  const updateMemberJob = useCallback(
    async (scheduleId: string, characterId: string, newJob: string) => {
      try {
        setError(null);
        await scheduleService.updateMemberJob(scheduleId, characterId, newJob);
      } catch (err) {
        setError(err instanceof Error ? err.message : '직업 변경 실패');
        throw err;
      }
    },
    []
  );

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    joinParty,
    leaveParty,
    toggleClosed,
    getMySchedules,
    removeMember,
    deletePastSchedules,
    addMemberDirectly,
    updateMemberJob,
  };
};
