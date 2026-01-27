// src/pages/ta/TALayout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../App.css';
import bgImage from '../../assets/로그인 이미지.jpg';

function TALayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로가 활성화되었는지 확인하는 함수
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div style={layoutStyles.container}>
      {/* 1. 상단 헤더 */}
      <header style={layoutStyles.header}>
        <div style={layoutStyles.logoArea} onClick={() => navigate('/ta/main')}>
          <h1 style={layoutStyles.logo}>행정조교 시스템</h1>
        </div>
        <button 
            style={layoutStyles.logoutBtn} 
            onClick={handleLogout}
        >
          로그아웃
        </button>
      </header>

      <div style={layoutStyles.body}>
        {/* 2. 왼쪽 사이드바 */}
        <nav style={layoutStyles.sidebar}>
          
          {/* 문의 그룹 */}
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

          {/* 일반 메뉴 */}
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

          <div 
            style={isActive('/ta/ai') ? layoutStyles.menuItemActive : layoutStyles.menuItem}
            onClick={() => navigate('/ta/ai')}
          >
            AI 조교 리포트
          </div>
        </nav>

        {/* 3. 메인 컨텐츠 영역 (배경 이미지 + 유리 효과) */}
        <main style={layoutStyles.mainContent}>
            {children}
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
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 25px',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
    zIndex: 20
  },
  logoArea: { cursor: 'pointer' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#003675', margin: 0 },
  logoutBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    cursor: 'pointer'
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
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
    padding: '10px 25px',
    marginBottom: '5px'
  },
  menuItem: {
    padding: '12px 25px 12px 35px', // 들여쓰기
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: '500'
  },
  menuItemActive: {
    padding: '12px 25px 12px 35px',
    fontSize: '14px',
    color: '#003675',
    fontWeight: 'bold',
    backgroundColor: '#e3f2fd', // 활성화 배경색
    borderRight: '3px solid #003675',
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
    padding: '30px',
    overflowY: 'auto', // 컨텐츠 스크롤은 여기서 처리
    position: 'relative'
  }
};

export default TALayout;