// src/pages/student/StudentMain.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdEdit, MdAssignment, MdHelp, MdCampaign, MdCalendarToday, MdDescription, MdLogout, MdHome, MdPerson } from 'react-icons/md';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

const API = 'https://capstone-project-of74.onrender.com';

const MENU_ITEMS = [
  { icon: MdEdit, text: '문의하기', accent: '#1565c0', path: '/student/inquiry' },
  { icon: MdAssignment, text: '문의 내역', accent: '#2e7d32', path: '/student/history' },
  { icon: MdHelp, text: 'FAQ', accent: '#6a1b9a', path: '/student/faq' },
  { icon: MdCampaign, text: '공지사항', accent: '#ef6c00', path: '/student/notice' },
  { icon: MdCalendarToday, text: '캘린더', accent: '#00838f', path: '/student/calendar' },
  { icon: MdDescription, text: '공결 서류 제출', accent: '#c62828', alert: '추후에 추가될 기능입니다.' },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const diffDays = (fromStr, toStr) => Math.round((new Date(toStr) - new Date(fromStr)) / 86400000);

function StudentMain() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userGrade, setUserGrade] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    axios.get(`${API}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.data.must_change_password) {
        navigate('/change-password', { replace: true });
        return;
      }
      setUserName(response.data.name);
      setUserGrade(response.data.grade);
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

  // 최근 공지 미리보기
  useEffect(() => {
    axios.get(`${API}/notices?source=all&limit=20`)
      .then(res => setNotices(res.data))
      .catch(() => setNotices([]));
  }, []);

  // 다가오는 학사일정 미리보기 (올해 + 내년)
  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      axios.get(`${API}/academic-events?year=${year}&limit=300`),
      axios.get(`${API}/academic-events?year=${year + 1}&limit=300`),
    ])
      .then(([res1, res2]) => setEvents([...res1.data, ...res2.data]))
      .catch(() => setEvents([]));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const today = todayStr();
  const latestNotice = notices.find(n => n.target_grade === 0 || n.target_grade === userGrade);
  const upcomingEvent = events
    .filter(ev => ev.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

  const dDayLabel = upcomingEvent
    ? (upcomingEvent.start_date > today ? `D-${diffDays(today, upcomingEvent.start_date)}` : '진행중')
    : null;

  return (
    // 1. 전체 배경 컨테이너
    <div style={styles.pageContainer}>

      {/* 2. 상단 헤더 */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>행정조교 시스템</h1>
          <h3 style={styles.headerSubTitle}>
             {userName ? `${userName}님, 환영합니다!` : '학생용 대시보드'}
          </h3>
        </div>
        <div style={styles.avatar}>
          {userName ? userName.charAt(0) : <MdPerson size={20} />}
        </div>
      </div>

      {/* 3. 스크롤 가능한 본문 (인사이트 카드 + 메뉴) */}
      <div style={styles.contentArea}>
        <div style={styles.dashboardInner}>

          {/* 3-1. 인사이트 카드 (최근 공지 / 다가오는 일정) */}
          <div style={styles.insightRow}>
            <InsightCard
              icon={<MdCampaign size={19} />}
              accent="#1565c0"
              label="최근 공지"
              title={latestNotice ? latestNotice.title : '등록된 공지가 없습니다'}
              subtitle={latestNotice ? latestNotice.posted_date : ''}
              onClick={() => latestNotice && navigate(`/student/notice/${latestNotice.id}?source=${latestNotice.source}`)}
            />
            <InsightCard
              icon={<MdCalendarToday size={19} />}
              accent="#ef6c00"
              label="다가오는 일정"
              title={upcomingEvent ? upcomingEvent.title : '예정된 일정이 없습니다'}
              subtitle={upcomingEvent ? `${dDayLabel} · ${upcomingEvent.start_date} ~ ${upcomingEvent.end_date}` : ''}
              onClick={() => navigate('/student/calendar')}
            />
          </div>

          {/* 3-2. 메뉴 그리드 */}
          <div style={styles.menuGridContainer}>
            {MENU_ITEMS.map((item, idx) => (
              <MenuButton
                key={item.text}
                index={idx}
                accent={item.accent}
                icon={<item.icon size="100%" />}
                text={item.text}
                onClick={() => item.path ? navigate(item.path) : alert(item.alert)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. 하단 네비게이션 */}
      <nav style={styles.bottomNav}>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={handleLogout}>
          <MdLogout size={18} /> 로그아웃
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/main')}>
          <MdHome size={18} /> 홈
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/mypage')}>
          <MdPerson size={18} /> 마이페이지
        </motion.button>
      </nav>
    </div>
  );
}

// 인사이트 카드 (최근 공지 / 다가오는 일정 미리보기)
function InsightCard({ icon, accent, label, title, subtitle, onClick }) {
  return (
    <motion.div
      style={styles.insightCard}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 8px 18px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ ...styles.insightIconWrap, backgroundColor: accent }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={styles.insightLabel}>{label}</div>
        <div style={styles.insightTitle}>{title}</div>
        {subtitle && <div style={styles.insightSubtitle}>{subtitle}</div>}
      </div>
    </motion.div>
  );
}

// 메뉴 버튼 (반응형 + 항목별 강조 색상)
function MenuButton({ onClick, icon, text, accent, index }) {
  return (
    <motion.button
      style={styles.menuBtn}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.97 }}
    >
      <span style={{ ...styles.menuIconWrap, backgroundColor: `${accent}1f`, color: accent }}>
        <span style={styles.menuIcon}>{icon}</span>
      </span>
      <span style={styles.menuText}>{text}</span>
    </motion.button>
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
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
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

  avatar: {
    width: 'clamp(36px, 9vw, 46px)',
    height: 'clamp(36px, 9vw, 46px)',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(15px, 4vw, 19px)',
    fontWeight: 'bold',
    flexShrink: 0
  },

  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 'clamp(15px, 4vw, 30px)',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },

  // PC에서 카드가 지나치게 넓게 늘어지지 않도록 폭을 제한하고 가운데 정렬
  dashboardInner: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(12px, 3vw, 18px)',
    width: '100%',
    maxWidth: '760px',
    margin: '0 auto'
  },

  // auto-fit 그리드: 카드 폭이 200px 미만이 되면 자동으로 세로 배치되어 잘림 방지
  insightRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'clamp(10px, 3vw, 16px)'
  },

  insightCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '16px',
    padding: '14px 16px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },

  insightIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },

  insightLabel: { fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '2px' },
  insightTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  insightSubtitle: { fontSize: '12px', color: '#777', marginTop: '3px' },

  // flex: 1 로 contentArea의 남는 세로 공간을 항상 채워 하단에 빈 공간이 생기지 않도록 함
  menuGridContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'repeat(3, minmax(90px, 1fr))',
    gap: 'clamp(10px, 3vw, 20px)'
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
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    padding: '12px'
  },

  menuIconWrap: {
    width: 'clamp(40px, 11vw, 54px)',
    height: 'clamp(40px, 11vw, 54px)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'clamp(6px, 2vw, 10px)'
  },

  menuIcon: {
    width: 'clamp(20px, 6vw, 28px)',
    height: 'clamp(20px, 6vw, 28px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  menuText: {
    fontSize: 'clamp(14px, 4vw, 19px)',
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    fontSize: 'clamp(12px, 3.2vw, 15px)', // 하단 버튼 폰트 반응형
    fontWeight: 'bold',
    color: '#003675',
    cursor: 'pointer',
    padding: '10px'
  }
};

export default StudentMain;
