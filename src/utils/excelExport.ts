import * as XLSX from 'xlsx';
import type { Schedule } from '../types';

interface ExcelRow {
  날짜: string;
  시간: string;
  컨텐츠: string;
  상세: string;
  난이도: string;
  제목: string;
  파티장: string;
  파티장직업: string;
  멤버1: string;
  멤버1직업: string;
  멤버2: string;
  멤버2직업: string;
  멤버3: string;
  멤버3직업: string;
  멤버4: string;
  멤버4직업: string;
  멤버5: string;
  멤버5직업: string;
  멤버6: string;
  멤버6직업: string;
  멤버7: string;
  멤버7직업: string;
  최대인원: number;
  현재인원: number;
  마감여부: string;
  비고: string;
}

export const exportSchedulesToExcel = (schedules: Schedule[], filename?: string) => {
  // 일정 데이터를 엑셀 형식으로 변환
  const data: ExcelRow[] = schedules.map((schedule) => {
    const row: ExcelRow = {
      날짜: schedule.date,
      시간: schedule.time,
      컨텐츠: schedule.type,
      상세: schedule.contentName,
      난이도: schedule.difficulty,
      제목: schedule.title,
      파티장: schedule.leaderNickname,
      파티장직업: schedule.leaderJob || '',
      멤버1: '',
      멤버1직업: '',
      멤버2: '',
      멤버2직업: '',
      멤버3: '',
      멤버3직업: '',
      멤버4: '',
      멤버4직업: '',
      멤버5: '',
      멤버5직업: '',
      멤버6: '',
      멤버6직업: '',
      멤버7: '',
      멤버7직업: '',
      최대인원: schedule.maxMembers,
      현재인원: schedule.members.length + 1, // 파티장 포함
      마감여부: schedule.isClosed ? '마감' : '모집중',
      비고: schedule.note,
    };

    // 멤버 정보 추가
    schedule.members.forEach((member, index) => {
      const memberKey = `멤버${index + 1}` as keyof ExcelRow;
      const jobKey = `멤버${index + 1}직업` as keyof ExcelRow;
      (row[memberKey] as string) = member.nickname;
      (row[jobKey] as string) = member.job;
    });

    return row;
  });

  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 열 너비 설정
  const colWidths = [
    { wch: 12 }, // 날짜
    { wch: 8 },  // 시간
    { wch: 8 },  // 컨텐츠
    { wch: 15 }, // 상세
    { wch: 12 }, // 난이도
    { wch: 20 }, // 제목
    { wch: 12 }, // 파티장
    { wch: 12 }, // 파티장직업
    { wch: 12 }, // 멤버1
    { wch: 12 }, // 멤버1직업
    { wch: 12 }, // 멤버2
    { wch: 12 }, // 멤버2직업
    { wch: 12 }, // 멤버3
    { wch: 12 }, // 멤버3직업
    { wch: 12 }, // 멤버4
    { wch: 12 }, // 멤버4직업
    { wch: 12 }, // 멤버5
    { wch: 12 }, // 멤버5직업
    { wch: 12 }, // 멤버6
    { wch: 12 }, // 멤버6직업
    { wch: 12 }, // 멤버7
    { wch: 12 }, // 멤버7직업
    { wch: 10 }, // 최대인원
    { wch: 10 }, // 현재인원
    { wch: 10 }, // 마감여부
    { wch: 30 }, // 비고
  ];
  worksheet['!cols'] = colWidths;

  // 워크시트를 워크북에 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, '일정목록');

  // 파일명 생성
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const defaultFilename = `마비노기_일정_${dateStr}.xlsx`;

  // 엑셀 파일 다운로드
  XLSX.writeFile(workbook, filename || defaultFilename);
};
