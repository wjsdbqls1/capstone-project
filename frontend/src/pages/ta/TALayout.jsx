// src/pages/ta/TALayout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../App.css';
import bgImage from '../../assets/로그인 이미지.jpg';

function TALayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  // 현재 경로가 활성화되었는지 확인
  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      {/* 1. 상단 헤더 (진한 파란색 바) */}
      <header style={styles.header}>
        <div style={styles.logoArea} onClick={() => navigate('/ta/pending')}>
          <h1 style={styles.logo}>행정조교 시스템</h1>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div style={styles.body}>
        {/* 2. 왼쪽 사이드바 */}
        <nav style={styles.sidebar}>
          
          {/* 문의 그룹 (부모 메뉴) */}
          <div style={styles.menuGroup}>
            <div style={styles.groupTitle}>문의</div>
            <div 
              style={isActive('/ta/pending') ? styles.menuItemActive : styles.menuItem}
              onClick={() => navigate('/ta/pending')}
            >
              대기중인 문의
            </div>
            <div 
              style={isActive('/ta/completed') ? styles.menuItemActive : styles.menuItem}
              onClick={() => navigate('/ta/completed')}
            >
              처리 완료 문의
            </div>
          </div>

          <div style={styles.divider}></div>

          {/* 일반 메뉴들 */}
          <div 
            style={isActive('/ta/notice') ? styles.menuItemActive : styles.menuItem}
            onClick={() => navigate('/ta/notice')}
          >
            공지사항
          </div>
          <div 
            style={isActive('/ta/faq') ? styles.menuItemActive : styles.menuItem}
            onClick={() => navigate('/ta/faq')}
          >
            FAQ
          </div>
          <div 
            style={isActive('/ta/absence') ? styles.menuItemActive : styles.menuItem}
            onClick={() => navigate('/ta/absence')}
          >
            공결 신청
          </div>
          <div 
            style={isActive('/ta/calendar') ? styles.menuItemActive : styles.menuItem}
            onClick={() => navigate('/ta/calendar')}
          >
            캘린더
          </div>
          
          <div style={styles.divider}></div>

          <div 
            style={isActive('/ta/ai') ? styles.menuItemActive : styles.menuItem}
            onClick={() => navigate('/ta/ai')}
          >
            AI 조교 리포트
          </div>
        </nav>

        {/* 3. 메인 컨텐츠 영역 (배경 + 유리 박스) */}
        <main style={styles.mainContent}>
            <div style={styles.glassBox}>
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
  },
  header: {
    height: '60px',
    backgroundColor: '#003675', // 요청하신 진한 파란색
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 25px',
    flexShrink: 0,
    zIndex: 20,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },
  logoArea: { cursor: 'pointer' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 },
  logoutBtn: {
    padding: '6px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  sidebar: {
    width: '220px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto'
  },
  menuGroup: { marginBottom: '10px' },
  groupTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#003675',
    padding: '10px 25px',
    marginBottom: '5px'
  },
  menuItem: {
    padding: '12px 25px 12px 40px', // 들여쓰기
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: '500'
  },
  menuItemActive: {
    padding: '12px 25px 12px 36px',
    fontSize: '14px',
    color: '#003675',
    fontWeight: 'bold',
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #003675',
    cursor: 'pointer'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '10px 20px'
  },

  mainContent: {
    flex: 1,
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '30px', // 배경 위 여백
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  },
  // 공통 유리 박스 스타일
  glassBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)', // 반투명 흰색
    backdropFilter: 'blur(15px)', // 블러 효과
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' // 내부 스크롤을 위해
  }
};

export default TALayout;