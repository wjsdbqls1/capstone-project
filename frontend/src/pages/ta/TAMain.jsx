// src/pages/ta/TAMain.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function TAMain() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    // 1. 전체 배경 컨테이너
    <div style={styles.pageContainer}>
      
      {/* 2. 상단 헤더 */}
      <div style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <h1 style={styles.headerTitle}>행정조교 시스템</h1>
        </div>
        
        {/* 상단 로그아웃 버튼 */}
        <button 
          style={styles.logoutBtn} 
          onClick={handleLogout}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
           로그아웃
        </button>
      </div>

      {/* 3. 메뉴 그리드 영역 */}
      <div style={styles.menuGridContainer}>
        
        {/* 관리자 메뉴 버튼들 */}
        <MenuButton 
            onClick={() => navigate('/ta/pending')} 
            icon="⏳" 
            text="대기중인 문의" 
        />
        <MenuButton 
            onClick={() => navigate('/ta/completed')} 
            icon="✅" 
            text="처리 완료 문의" 
        />
        <MenuButton 
            onClick={() => navigate('/ta/notice')} 
            icon="📢" 
            text="공지사항 관리" 
        />
        <MenuButton 
            onClick={() => navigate('/ta/faq')} 
            icon="❓" 
            text="FAQ 관리" 
        />
        <MenuButton 
            onClick={() => navigate('/ta/absence')} 
            icon="📄" 
            text="공결 신청 관리" 
        />
        <MenuButton 
            onClick={() => navigate('/ta/calendar')} 
            icon="📅" 
            text="캘린더 관리" 
        />

        {/* AI 리포트 (가로 꽉 채우기) */}
        <div style={{gridColumn: '1 / -1', width: '100%', height: '100%'}}>
            <MenuButton 
                onClick={() => navigate('/ta/ai')} 
                icon="🤖" 
                text="AI 조교 리포트 확인" 
                isFullWidth={true}
            />
        </div>
      
      </div>
    </div>
  );
}

// 버튼 컴포넌트 (학생용과 동일한 디자인 + FullWidth 옵션)
function MenuButton({ onClick, icon, text, isFullWidth }) {
  return (
    <button 
        style={{
            ...styles.menuBtn, 
            backgroundColor: isFullWidth ? 'rgba(227, 242, 253, 0.85)' : 'rgba(255, 255, 255, 0.55)', // AI 버튼은 약간 푸른빛
            border: isFullWidth ? '1px solid #bbdefb' : '1px solid rgba(255, 255, 255, 0.6)'
        }} 
        onClick={onClick}
    >
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
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  headerTitle: {
    margin: 0, 
    fontSize: 'clamp(20px, 5vw, 24px)', 
    fontWeight: 'bold'
  },

  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px', 
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(5px)',
    transition: 'all 0.2s ease',
  },

  menuGridContainer: {
    flex: 1, 
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // 2열 고정
    // gridAutoRows는 내용에 따라 자동 조절되지만, 최소 높이 확보
    gridAutoRows: 'minmax(120px, 1fr)', 
    gap: 'clamp(10px, 3vw, 20px)', 
    padding: 'clamp(20px, 5vw, 40px)', 
    overflowY: 'auto' 
  },

  menuBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    
    // 기본 유리 질감
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    
    cursor: 'pointer',
    transition: 'transform 0.2s',
    width: '100%',
    height: '100%',
    padding: '15px'
  },

  menuIcon: {
    fontSize: 'clamp(28px, 8vw, 40px)', 
    marginBottom: 'clamp(5px, 2vw, 10px)'
  },
  
  menuText: {
    fontSize: 'clamp(16px, 4.5vw, 20px)', 
    fontWeight: 'bold', 
    color: '#003675', // 텍스트 색상을 좀 더 진하게 (가독성)
    textAlign: 'center',
    wordBreak: 'keep-all'
  }
};

export default TAMain;