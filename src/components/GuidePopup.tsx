import React, { useState } from 'react';
import './GuidePopup.css';

const GuidePopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 가이드 버튼 */}
      <button
        className="guide-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="사용 가이드"
      >
        {isOpen ? '✕' : '?'}
      </button>

      {/* 가이드 팝업 */}
      {isOpen && (
        <div className="guide-popup">
          <div className="guide-popup-header">
            <h3>📱 새녘 모비노기 스케줄러 가이드</h3>
            <button className="guide-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="guide-popup-content">
            <p className="guide-intro">
              마비노기 모바일의 어비스 & 레이드 파티 일정을 효율적으로 관리하는 웹 앱입니다.
            </p>

            <div className="guide-section">
              <h4>1. 시작하기: 계정 관리</h4>
              <ul>
                <li><strong>회원가입:</strong> [회원가입] 버튼 → 닉네임과 코드(비밀번호) 입력</li>
                <li><strong>로그인:</strong> 설정한 코드를 입력하여 접속</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>2. 캐릭터 설정</h4>
              <ul>
                <li><strong>등록:</strong> [캐릭터] 탭 → [+ 추가] → 닉네임 및 직업 선택</li>
                <li><strong>전환:</strong> 캐릭터 카드를 탭하여 활동 캐릭터 선택</li>
                <li><strong>관리:</strong> 수정 및 삭제 가능</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>3. 일정 확인 및 참여</h4>
              <ul>
                <li><strong>필터링:</strong> 컨텐츠별 필터 및 닉네임 검색</li>
                <li><strong>보기:</strong> 카드형 / 표 형식 전환 가능</li>
                <li><strong>참여:</strong> [참여하기] → 직업 선택</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>4. 일정 등록 및 복사</h4>
              <ul>
                <li><strong>신규:</strong> [일정 등록] 탭에서 정보 입력</li>
                <li><strong>복사:</strong> 기존 일정에서 [복사] 버튼 활용</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>5. 파티장 전용 기능</h4>
              <ul>
                <li><strong>정보 수정:</strong> 제목, 시간, 난이도 변경</li>
                <li><strong>멤버 관리:</strong> 추가/수정/강퇴 가능</li>
                <li><strong>닉네임/직업:</strong> 클릭하여 즉시 수정</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>6. 내 일정 및 저장</h4>
              <ul>
                <li><strong>내 일정:</strong> 참여/등록된 일정 모아보기</li>
                <li><strong>이미지 저장:</strong> 간단히/상세히 선택</li>
              </ul>
            </div>

            <div className="guide-tips">
              <h4>💡 이용 꿀팁</h4>
              <ul>
                <li>직업이 고민될 땐 <strong>'미정'</strong>으로 참여 후 나중에 변경</li>
                <li>타인이 내 닉네임으로 등록하면 <strong>내 일정</strong>에 자동 표시</li>
                <li>많은 일정 확인 시 <strong>'표 보기'</strong> 모드가 편리</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isOpen && <div className="guide-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default GuidePopup;
