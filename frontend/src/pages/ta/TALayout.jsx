// src/pages/ta/TALayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MdMenu, MdInbox, MdCheckCircle, MdCampaign, MdHelp, MdDescription, MdCalendarToday, MdPeople, MdBarChart, MdLogout } from 'react-icons/md';
import '../../App.css';
import bgImage from '../../assets/로그인 이미지.jpg';
import NotificationToggle from '../../components/NotificationToggle';
import { unsubscribeFromPush } from '../../pushNotifications';

const API = 'https://capstone-project-of74.onrender.com';

function TALayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  // 비밀번호 변경이 필요한 계정이면 강제로 변경 화면으로 이동
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.must_change_password) {
          navigate('/change-password', { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  // 대기중인 문의 개수 — 페이지 이동할 때마다(문의 처리 후 등) 최신 상태로 갱신.
  // 전체 목록(/inquiries)을 불러오면 문의 목록 페이지 자체의 조회와 겹쳐 무거워지므로
  // 개수만 세는 가벼운 전용 API를 사용함
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/inquiries/pending-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPendingCount(res.data.count))
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await unsubscribeFromPush();
      } catch (e) {
        console.error('푸시 구독 해지 실패:', e);
      }
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
                    <MdMenu size={26} />
                </button>
            )}
            <div style={layoutStyles.logoArea} onClick={() => navigate('/ta/pending')}>
                <h1 style={layoutStyles.logo}>행정조교 시스템</h1>
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationToggle style={layoutStyles.notifyBtn} activeStyle={layoutStyles.notifyBtnActive} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} style={layoutStyles.logoutBtn} onClick={handleLogout}>
            <MdLogout size={15} /> 로그아웃
          </motion.button>
        </div>
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
            <div style={isActive('/ta/pending') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/pending')}>
              <MdInbox size={18} /> 대기중인 문의
              {pendingCount > 0 && <span style={layoutStyles.badge}>{pendingCount}</span>}
            </div>
            <div style={isActive('/ta/completed') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/completed')}><MdCheckCircle size={18} /> 처리 완료 문의</div>
          </div>

          <div style={layoutStyles.divider}></div>

          <div style={isActive('/ta/notice') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/notice')}><MdCampaign size={18} /> 공지사항</div>
          <div style={isActive('/ta/faq') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/faq')}><MdHelp size={18} /> FAQ</div>
          <div style={isActive('/ta/absence') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/absence')}><MdDescription size={18} /> 공결 신청</div>
          <div style={isActive('/ta/calendar') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/calendar')}><MdCalendarToday size={18} /> 캘린더</div>
          <div style={isActive('/ta/students') ? layoutStyles.menuItemActive : layoutStyles.menuItem} onClick={() => handleMenuClick('/ta/students')}><MdPeople size={18} /> 학생 관리</div>

          <div style={layoutStyles.divider}></div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={layoutStyles.aiMenuItem}
            onClick={() => handleMenuClick('/ta/ai')}
          >
            <MdBarChart size={20} />
            <span style={{position:'relative', top:'1px'}}>문의 리포트</span>
          </motion.div>
        </nav>

        {/* 3. 메인 컨텐츠 영역 — 사이드바/헤더는 그대로 두고 이 안쪽만 부드럽게 전환 */}
        <main style={{...layoutStyles.mainContent, padding: isMobile ? '15px' : '30px'}}>
            <div style={{...layoutStyles.glassBox, padding: isMobile ? '15px' : '30px'}}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={layoutStyles.contentAnimator}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
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
    // height:100vh 대신 position:fixed + inset:0 사용.
    // iOS PWA(홈 화면 추가) standalone 모드에서는 100vh가 실제 화면과
    // 어긋나 하단에 흰 여백이 드러나는 경우가 있어, 뷰포트 4면에
    // 항상 정확히 맞춰지는 fixed+inset 방식이 더 안전함
    position: 'fixed',
    inset: 0,
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
  menuBtn: { background:'none', border:'none', color:'white', fontSize:'28px', cursor:'pointer', padding:0, marginRight:'5px' },
  logoArea: { cursor: 'pointer' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0, letterSpacing: '-0.5px' }, // 폰트 사이즈 증가
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '15px', // 폰트 사이즈 증가
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  notifyBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  notifyBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#003675',
  },
  
  body: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' },
  
  sidebar: {
    width: '260px', // 사이드바 너비 약간 증가
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    padding: '25px 0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
    transition: 'left 0.3s ease'
  },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:999 },
  
  menuGroup: { marginBottom: '15px' },
  groupTitle: { fontSize: '20px', fontWeight: '800', color: '#003675', padding: '10px 30px', marginBottom: '5px' }, // 폰트 사이즈 증가
  menuItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 30px 14px 40px', fontSize: '17px', color: '#555', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }, // 폰트 사이즈 및 패딩 증가
  menuItemActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 30px 14px 35px', fontSize: '17px', color: '#003675', fontWeight: 'bold', backgroundColor: '#e3f2fd', borderLeft: '5px solid #003675', cursor: 'pointer' }, // 폰트 사이즈 및 패딩 증가
  // 대기중인 문의 개수 배지
  badge: {
    marginLeft: 'auto',
    backgroundColor: '#e53935',
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '22px',
    height: '22px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    boxShadow: '0 1px 4px rgba(229, 57, 53, 0.5)'
  },
  divider: { height: '1px', backgroundColor: '#eee', margin: '15px 30px' },
  aiMenuItem: { margin: '10px 20px', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #003675 0%, #1976d2 100%)', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 54, 117, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }, // 폰트 사이즈 증가

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
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  // 각 TA 페이지가 기존에 flex:1로 스스로 높이를 채우던 방식을 그대로 쓸 수 있도록
  // 이 래퍼도 동일하게 flex 컨테이너로 동작시킴
  contentAnimator: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column'
  }
};

export default TALayout;