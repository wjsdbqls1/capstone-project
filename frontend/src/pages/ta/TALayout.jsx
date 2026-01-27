// src/pages/ta/TALayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../App.css';
import bgImage from '../../assets/로그인 이미지.jpg';

function TALayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false); // PC로 돌아오면 사이드바 자동 정리
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  // 페이지 이동 시 모바일이면 사이드바 닫기
  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div style={layoutStyles.container}>
      {/* 1. 상단 헤더 */}
      <header style={layoutStyles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            {/* 모바일용 햄버거 메뉴 버튼 */}
            {isMobile && (
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={layoutStyles.menuBtn}>
                    ☰
                </button>
            )}
            <div style={layoutStyles.logoArea} onClick={() => navigate('/ta/pending')}>
                <h1 style={layoutStyles.logo}>행정조교 시스템</h1>
            </div>
        </div>
        <button style={layoutStyles.logoutBtn} onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div style={layoutStyles.body}>
        {/* 2. 왼쪽 사이드바 (모바일에서는 오버레이 형태로 동작) */}
        {isMobile && isSidebarOpen && (
            <div style={layoutStyles.overlay} onClick={() => setIsSidebarOpen(false)} />
        )}
        <nav style={{
            ...layoutStyles.sidebar,
            ...(isMobile ? {
                position: 'fixed',
                left: isSidebarOpen ? 0 : '-260px', // 토글 애니메이션
                height: '100%',
                zIndex: 1000,
                boxShadow: isSidebarOpen ? '2px 0 10px rgba(0,0,0,0.2)' : 'none'
            } : {})
        }}>
          
          <div style={layoutStyles.menuGroup}>
            <div style={layoutStyles.groupTitle}>문의</div>
            <div style={isActive('/ta/pending') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/pending')}>대기중인 문의</div>
            <div style={isActive('/ta/completed') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/completed')}>처리 완료 문의</div>
          </div>

          <div style={layoutStyles.divider}></div>

          <div style={isActive('/ta/notice') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/notice')}>공지사항</div>
          <div style={isActive('/ta/faq') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/faq')}>FAQ</div>
          <div style={isActive('/ta/absence') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/absence')}>공결 신청</div>
          <div style={isActive('/ta/calendar') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/calendar')}>캘린더</div>
          
          <div style={layoutStyles.divider}></div>

          <div 
            style={layoutStyles.aiMenuItem}
            onClick={() => handleMenuClick('/ta/ai')}
          >
            <span style={{fontSize:'18px'}}>🤖</span> 
            <span style={{position:'relative', top:'1px'}}>AI 조교 리포트</span>
          </div>
        </nav>

        {/* 3. 메인 컨텐츠 영역 */}
        <main style={{...layoutStyles.mainContent, padding: isMobile ? '15px' : '30px'}}>
            <div style={{...layoutStyles.glassBox, padding: isMobile ? '15px' : '30px'}}>
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
    padding: '0 20px',
    flexShrink: 0,
    zIndex: 20,
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
  },
  menuBtn: { background:'none', border:'none', color:'white', fontSize:'24px', cursor:'pointer', padding:0, marginRight:'5px' },
  logoArea: { cursor: 'pointer' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '-0.5px' },
  logoutBtn: {
    padding: '6px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  
  body: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' },
  
  sidebar: {
    width: '240px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    padding: '25px 0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
    transition: 'left 0.3s ease' // 모바일 슬라이드 효과
  },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:999 },
  
  menuGroup: { marginBottom: '15px' },
  groupTitle: { fontSize: '15px', fontWeight: '800', color: '#003675', padding: '10px 30px', marginBottom: '5px' },
  menuItem: { padding: '12px 30px 12px 45px', fontSize: '15px', color: '#555', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' },
  menuItemActive: { padding: '12px 30px 12px 40px', fontSize: '15px', color: '#003675', fontWeight: 'bold', backgroundColor: '#e3f2fd', borderLeft: '5px solid #003675', cursor: 'pointer' },
  divider: { height: '1px', backgroundColor: '#eee', margin: '15px 30px' },
  aiMenuItem: { margin: '10px 20px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #003675 0%, #1976d2 100%)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },

  mainContent: {
    flex: 1,
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  },
  glassBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px', // 모바일에서는 padding이 15px로 조절됨 (위쪽 코드 참조)
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};

export default TALayout;