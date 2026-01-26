// src/pages/student/StudentMain.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg'; 

function StudentMain() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    axios.get('http://localhost:8000/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      setUserName(response.data.name);
    })
    .catch(error => {
      console.error("사용자 정보 로딩 실패:", error);
      if (error.response && error.response.status === 401) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.clear();
        navigate('/');
      }
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    // 1. 전체 배경 컨테이너
    <div style={styles.pageContainer}>
      
      {/* 2. 상단 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>행정조교 시스템</h1>
        <h3 style={styles.headerSubTitle}>
           {userName ? `${userName}님, 환영합니다!` : '학생용 대시보드'}
        </h3>
      </div>

      {/* 3. 메뉴 그리드 영역 */}
      <div style={styles.menuGridContainer}>
        
        {/* 각 메뉴 버튼들 */}
        <MenuButton onClick={() => navigate('/student/inquiry')} icon="📝" text="문의하기" />
        <MenuButton onClick={() => navigate('/student/history')} icon="📋" text="문의 내역" />
        <MenuButton onClick={() => navigate('/student/faq')} icon="❓" text="FAQ" />
        <MenuButton onClick={() => navigate('/student/notice')} icon="📢" text="공지사항" />
        <MenuButton onClick={() => navigate('/student/calendar')} icon="📅" text="캘린더" />
        <MenuButton onClick={() => navigate('/student/absence')} icon="📄" text="공결 서류 제출" />
      
      </div>

      {/* 4. 하단 네비게이션 */}
      <nav style={styles.bottomNav}>
        <button style={styles.navBtn} onClick={handleLogout}>🚪 로그아웃</button>
        <button style={styles.navBtn} onClick={() => navigate('/student/main')}>🏠 홈</button>
        <button style={styles.navBtn} onClick={() => navigate('/student/mypage')}>👤 마이페이지</button>
      </nav>
    </div>
  );
}

// 버튼 컴포넌트 (반응형 적용)
function MenuButton({ onClick, icon, text }) {
  return (
    <button style={styles.menuBtn} onClick={onClick}>
      <span style={styles.menuIcon}>{icon}</span>
      <span style={styles.menuText}>{text}</span>
    </button>
  );
}

const styles = {
  pageContainer: {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // 100vh 대신 100dvh 사용 (모바일 브라우저 주소창 대응)
    height: '100dvh', 
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)', 
    padding: '15px 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    color: 'white',
    zIndex: 10,
    flexShrink: 0 // 헤더 크기 고정
  },
  
  // clamp(최소, 권장, 최대) -> 화면 크기에 따라 폰트 조절
  headerTitle: {
    margin: '0 0 5px 0', 
    fontSize: 'clamp(22px, 5vw, 30px)', 
    fontWeight: 'bold'
  },
  headerSubTitle: {
    margin: 0, 
    fontWeight: '400', 
    fontSize: 'clamp(16px, 4vw, 20px)', 
    opacity: 0.9
  },

  menuGridContainer: {
    flex: 1, 
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // 2열
    gridTemplateRows: '1fr 1fr 1fr', // 3행
    gap: 'clamp(10px, 3vw, 20px)', // 간격 반응형
    padding: 'clamp(15px, 4vw, 30px)', // 패딩 반응형
    overflowY: 'auto' // 화면이 너무 작으면 내부 스크롤
  },

  menuBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    
    // 유리 질감
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    
    cursor: 'pointer',
    transition: 'transform 0.2s',
    width: '100%',
    height: '100%',
    padding: '10px' // 내부 여백 추가
  },

  menuIcon: {
    fontSize: 'clamp(24px, 8vw, 36px)', // 아이콘 크기 반응형
    marginBottom: 'clamp(5px, 2vw, 10px)'
  },
  
  menuText: {
    fontSize: 'clamp(15px, 4.5vw, 22px)', // 텍스트 크기 반응형
    fontWeight: 'bold', 
    color: '#000000',
    textAlign: 'center',
    wordBreak: 'keep-all' // 단어 중간에 줄바꿈 방지
  },

  bottomNav: {
    height: '70px', // 높이 약간 축소
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    flexShrink: 0
  },
  
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: 'clamp(14px, 4vw, 18px)', // 하단 버튼 폰트 반응형
    fontWeight: 'bold',
    color: '#003675',
    cursor: 'pointer',
    padding: '10px'
  }
};

export default StudentMain;