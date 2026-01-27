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

  const isActive = (path) => location.pathname === path;

  return (
    <div style={layoutStyles.container}>
      {/* 1. 상단 헤더 (요청하신 파란색 바 스타일) */}
      <header style={layoutStyles.header}>
        <div style={layoutStyles.logoArea} onClick={() => navigate('/ta/pending')}>
          <h1 style={layoutStyles.logo}>행정조교 시스템</h1>
        </div>
        <button style={layoutStyles.logoutBtn} onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div style={layoutStyles.body}>
        {/* 2. 왼쪽 사이드바 */}
        <nav style={layoutStyles.sidebar}>
          
          {/* 문의 그룹 (부모 메뉴) */}
          <div style={layoutStyles.menuGroup}>
            <div style={layoutStyles.groupTitle}>문의</div>
            <div 
              style={isActive('/ta/pending') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
              onClick={() => navigate('/ta/pending')}
            >
              대기중인 문의
            </div>
            <div 
              style={isActive('/ta/completed') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
              onClick={() => navigate('/ta/completed')}
            >
              처리 완료 문의
            </div>
          </div>

          <div style={layoutStyles.divider}></div>

          {/* 일반 메뉴들 */}
          <div 
            style={isActive('/ta/notice') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
            onClick={() => navigate('/ta/notice')}
          >
            공지사항
          </div>
          <div 
            style={isActive('/ta/faq') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
            onClick={() => navigate('/ta/faq')}
          >
            FAQ
          </div>
          <div 
            style={isActive('/ta/absence') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
            onClick={() => navigate('/ta/absence')}
          >
            공결 신청
          </div>
          <div 
            style={isActive('/ta/calendar') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
            onClick={() => navigate('/ta/calendar')}
          >
            캘린더
          </div>
          
          <div style={layoutStyles.divider}></div>

          {/* AI 조교 리포트 (강조 스타일) */}
          <div 
            style={layoutStyles.aiMenuItem}
            onClick={() => navigate('/ta/ai')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{fontSize:'16px'}}>🤖</span> AI 조교 리포트
          </div>
        </nav>

        {/* 3. 메인 컨텐츠 영역 */}
        <main style={layoutStyles.mainContent}>
            {/* 개별 페이지의 내용은 이 glassBox 안으로 들어갑니다 */}
            <div style={layoutStyles.glassBox}>
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}

const layoutStyles = {
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
    padding: '0 30px',
    flexShrink: 0,
    zIndex: 20,
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  logoArea: { cursor: 'pointer' },
  logo: { fontSize: '22px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '-0.5px' },
  logoutBtn: {
    padding: '6px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
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
    width: '230px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    padding: '25px 0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto'
  },
  menuGroup: { marginBottom: '15px' },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#003675',
    padding: '10px 30px',
    marginBottom: '5px'
  },
  menuItem: {
    padding: '12px 30px 12px 45px', // 계층 구조 표현을 위한 들여쓰기
    fontSize: '15px',
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  menuItemActive: {
    padding: '12px 30px 12px 40px',
    fontSize: '15px',
    color: '#003675',
    fontWeight: 'bold',
    backgroundColor: '#e3f2fd',
    borderLeft: '5px solid #003675', // 왼쪽 활성 표시줄
    cursor: 'pointer'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '15px 30px'
  },
  // AI 리포트 강조 스타일
  aiMenuItem: {
    margin: '10px 20px',
    padding: '12px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #003675 0%, #1976d2 100%)', // 파란색 그라데이션
    color: 'white',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s ease'
  },

  mainContent: {
    flex: 1,
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  },
  glassBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 반투명 배경
    backdropFilter: 'blur(20px)', // 블러 효과
    borderRadius: '24px',
    padding: '35px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};

export default TALayout;