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
      <header style={layoutStyles.header}>
        <div style={layoutStyles.logoArea} onClick={() => navigate('/ta/pending')}>
          <h1 style={layoutStyles.logo}>행정조교 시스템</h1>
        </div>
        <button style={layoutStyles.logoutBtn} onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div style={layoutStyles.body}>
        <nav style={layoutStyles.sidebar}>
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
            style={layoutStyles.aiMenuItem}
            onClick={() => navigate('/ta/ai')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{fontSize:'18px'}}>🤖</span> 
            <span style={{position:'relative', top:'1px'}}>AI 조교 리포트</span>
          </div>
        </nav>

        <main style={layoutStyles.mainContent}>
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
    backgroundColor: '#003675',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    flexShrink: 0,
    zIndex: 20,
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
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
    fontSize: '15px',
    fontWeight: '800',
    color: '#003675',
    padding: '10px 30px',
    marginBottom: '5px'
  },
  menuItem: {
    padding: '12px 30px 12px 45px',
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
    borderLeft: '5px solid #003675',
    cursor: 'pointer'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '15px 30px'
  },
  aiMenuItem: {
    margin: '10px 20px',
    padding: '12px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #003675 0%, #1976d2 100%)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 불투명도 높여 가독성 확보
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '35px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};

export default TALayout;