// src/pages/student/StudentMain.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdEdit, MdAssignment, MdHelp, MdCampaign, MdCalendarToday, MdDescription, MdLogout, MdHome, MdPerson, MdChevronRight } from 'react-icons/md';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

const API = 'https://capstone-project-of74.onrender.com';

// 목록형 보조 메뉴 (문의하기는 상단 CTA로 별도 처리)
const LIST_ITEMS = [
  { icon: MdAssignment, text: '문의 내역', path: '/student/history' },
  { icon: MdHelp, text: 'FAQ', path: '/student/faq' },
  { icon: MdCampaign, text: '공지사항', path: '/student/notice' },
  { icon: MdCalendarToday, text: '캘린더', path: '/student/calendar' },
  { icon: MdDescription, text: '공결 서류 제출', alert: '추후에 추가될 기능입니다.' },
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

      {/* 3. 유리 박스 — 다른 페이지(FAQ/공지사항 등)와 동일한 크기·투명도 규칙 적용 */}
      <div style={styles.glassContainer}>
        <div style={styles.innerContent}>

          {/* 3-1. 정보 카드 (최근 공지 / 다가오는 일정) — 세로 배열, 단색 톤으로 통일 */}
          <div style={styles.infoStrip}>
            <InfoHalf
              icon={<MdCampaign size={18} />}
              label="최근 공지"
              title={latestNotice ? latestNotice.title : '등록된 공지가 없습니다'}
              subtitle={latestNotice ? latestNotice.posted_date : ''}
              onClick={() => latestNotice && navigate(`/student/notice/${latestNotice.id}?source=${latestNotice.source}`)}
            />
            <InfoHalf
              icon={<MdCalendarToday size={18} />}
              label="다가오는 일정"
              title={upcomingEvent ? upcomingEvent.title : '예정된 일정이 없습니다'}
              subtitle={upcomingEvent ? `${dDayLabel} · ${upcomingEvent.start_date} ~ ${upcomingEvent.end_date}` : ''}
              onClick={() => navigate('/student/calendar')}
            />
          </div>

          {/* 3-2. 주요 액션 (문의하기) — 하나만 강조해 시각적 위계를 줌 */}
          <motion.button
            style={styles.primaryCta}
            onClick={() => navigate('/student/inquiry')}
            whileHover={{ scale: 1.01, boxShadow: '0 10px 22px rgba(0, 54, 117, 0.35)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.primaryCtaIcon}><MdEdit size={22} /></span>
            <span style={{ flex: 1, textAlign: 'left' }}>문의하기</span>
            <MdChevronRight size={24} />
          </motion.button>

          {/* 3-3. 보조 메뉴 리스트 */}
          <div style={styles.menuList}>
            {LIST_ITEMS.map((item, idx) => (
              <MenuRow
                key={item.text}
                index={idx}
                icon={<item.icon size={22} />}
                text={item.text}
                isLast={idx === LIST_ITEMS.length - 1}
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

// 정보 카드 (최근 공지 / 다가오는 일정) — 리스트보다 눈에 띄도록 강조
function InfoHalf({ icon, label, title, subtitle, onClick }) {
  return (
    <motion.div style={styles.infoHalf} onClick={onClick} whileHover={{ y: -1, boxShadow: '0 6px 16px rgba(0, 54, 117, 0.18)' }} whileTap={{ scale: 0.99 }}>
      <div style={styles.infoIconWrap}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={styles.insightLabel}>{label}</div>
        <div style={styles.insightTitle}>{title}</div>
        {subtitle && <div style={styles.insightSubtitle}>{subtitle}</div>}
      </div>
      <MdChevronRight size={20} color="#003675" style={{ flexShrink: 0, opacity: 0.6 }} />
    </motion.div>
  );
}

// 보조 메뉴 리스트의 한 행
function MenuRow({ onClick, icon, text, index, isLast }) {
  return (
    <motion.div
      style={{ ...styles.menuRow, borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)' }}
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      whileHover={{ backgroundColor: 'rgba(0, 54, 117, 0.05)' }}
      whileTap={{ scale: 0.99 }}
    >
      <span style={styles.menuRowIconWrap}>{icon}</span>
      <span style={styles.menuRowText}>{text}</span>
      <MdChevronRight size={20} color="#aaa" />
    </motion.div>
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
    backgroundColor: 'rgba(0, 54, 117, 0.92)',
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

  // 다른 페이지(StudentNotice, StudentFAQ 등)의 glassContainer와 동일한 크기/투명도 규칙
  glassContainer: {
    flex: 1,
    margin: '15px',
    padding: 'clamp(15px, 3vw, 30px)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },

  // 다른 페이지의 리스트처럼 유리 박스 상단부터 콘텐츠를 채움 (세로 중앙 정렬 X)
  innerContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  infoStrip: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  // 리스트(menuRow)보다 눈에 띄도록: 그라데이션 배경 + 그림자 + 큰 아이콘 (다만 전체 높이는 절제)
  infoHalf: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    minWidth: 0,
    background: 'linear-gradient(135deg, rgba(0, 54, 117, 0.16), rgba(0, 54, 117, 0.05))',
    borderLeft: '5px solid #003675',
    borderRadius: '14px',
    padding: '12px 14px',
    boxShadow: '0 4px 14px rgba(0, 54, 117, 0.14)',
    cursor: 'pointer'
  },

  infoIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003675',
    color: 'white',
    boxShadow: '0 3px 8px rgba(0, 54, 117, 0.35)',
    flexShrink: 0
  },

  insightLabel: { fontSize: '12px', fontWeight: '800', color: '#003675', marginBottom: '2px', letterSpacing: '0.3px' },
  // 폭이 넓어졌으니 한 줄로 자르지 않고 최대 2줄까지 자연스럽게 보여줌
  insightTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#111',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.3'
  },
  insightSubtitle: {
    fontSize: '11px',
    color: '#555',
    marginTop: '3px',
    fontWeight: '700'
  },

  // 가장 자주 쓰는 액션이니 리스트보다 눈에 띄게 확대
  primaryCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    backgroundColor: '#003675',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '20px 18px',
    fontSize: 'clamp(17px, 4.6vw, 19px)',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(0, 54, 117, 0.28)',
    boxSizing: 'border-box'
  },

  primaryCtaIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  menuList: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: '14px',
    border: '1px solid rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },

  menuRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '21.5px 16px',
    cursor: 'pointer'
  },

  menuRowIconWrap: {
    width: '42.5px',
    height: '42.5px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 54, 117, 0.08)',
    color: '#003675',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  menuRowText: {
    flex: 1,
    fontSize: 'clamp(17.5px, 4.4vw, 18.5px)',
    fontWeight: '600',
    color: '#222'
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
