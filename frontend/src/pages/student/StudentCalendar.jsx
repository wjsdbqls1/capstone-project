// src/pages/student/StudentCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [events, setEvents] = useState([]); 
  
  // 팝업(모달) 상태
  const [selectedDate, setSelectedDate] = useState(null);       
  const [selectedEvents, setSelectedEvents] = useState([]);     
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      // 현재 보고 있는 연도의 일정을 불러옴 (연도 이동 시에도 표시되도록)
      const response = await axios.get(`https://capstone-project-of74.onrender.com/academic-events?year=${currentDate.getFullYear()}&limit=500`);
      setEvents(response.data);
    } catch (error) {
      console.error("일정 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const handleDateClick = (dateStr, dayEvents) => {
    setSelectedDate(dateStr);
    setSelectedEvents(dayEvents);
    setIsModalOpen(true);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // 날짜 차이 계산 (정확한 정수 반환)
  const getDiffDays = (startStr, endStr) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diffTime = e - s;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 겹치지 않는 고정 "줄(lane)"을 배정 (구글 캘린더처럼 주 단위로 호출됨).
  // (day별로 따로 쌓으면, 먼저 끝난 일정 자리로 다음 일정이 당겨 올라와서
  //  서로 다른 일정인데 하나로 이어진 것처럼 보이는 문제가 생김)
  const assignEventLanes = (rangeStart, rangeEnd) => {
    const relevant = events.filter(ev => ev.start_date <= rangeEnd && ev.end_date >= rangeStart);

    const sorted = [...relevant].sort((a, b) => {
      if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
      const durationA = getDiffDays(a.start_date, a.end_date);
      const durationB = getDiffDays(b.start_date, b.end_date);
      if (durationA !== durationB) return durationB - durationA;
      return a.title.localeCompare(b.title);
    });

    const laneLastEnd = []; // laneLastEnd[i] = 그 줄에 마지막으로 배정된 일정의 종료일
    const laneOf = new Map();
    for (const ev of sorted) {
      let lane = laneLastEnd.findIndex(endDate => endDate < ev.start_date);
      if (lane === -1) lane = laneLastEnd.length;
      laneLastEnd[lane] = ev.end_date;
      laneOf.set(ev.id, lane);
    }
    return laneOf;
  };

  // 대한민국 공휴일 여부 판별 (학교 사이트 크롤링 데이터 제목 기준)
  // 개교기념일은 학교 자체 휴일이라 "대체휴일"이 붙어도 국가 공휴일에서 제외
  const isHoliday = (title) => !title.includes('개교기념일') && /휴일|현충일|추석/.test(title);

  const formatDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // 구글 캘린더처럼 일요일(주 시작)마다 줄 배정을 새로 계산 →
    // 지난 주에 끝난 일정이 다음 주까지 자리를 차지하지 않게 됨
    const weekLaneCache = new Map();
    const getLanesForDay = (d) => {
      const dateObj = new Date(year, month, d);
      const dow = dateObj.getDay();
      const weekStart = formatDate(new Date(year, month, d - dow));
      const weekEnd = formatDate(new Date(year, month, d - dow + 6));
      if (!weekLaneCache.has(weekStart)) {
        weekLaneCache.set(weekStart, assignEventLanes(weekStart, weekEnd));
      }
      return weekLaneCache.get(weekStart);
    };

    const days = [];

    // 1. 빈 칸 (z-index 설정으로 가림 방지)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{...calStyles.dayCellEmpty, zIndex: 100}}></div>);
    }

    // 2. 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const currentDayOfWeek = new Date(year, month, d).getDay();
      const laneOf = getLanesForDay(d);

      let dayEvents = events.filter(ev => {
        return ev.start_date <= dateStr && ev.end_date >= dateStr;
      });

      const MAX_VISIBLE = 4;
      const maxLane = Math.max(-1, ...dayEvents.map(ev => laneOf.get(ev.id) ?? 0));
      const hiddenCount = dayEvents.filter(ev => (laneOf.get(ev.id) ?? 0) >= MAX_VISIBLE).length;

      // ★ 핵심 수정: 날짜가 빠를수록 높은 z-index 부여 (겹침 방지)
      const cellZIndex = 50 - d;

      days.push(
        <div
            key={d}
            style={{
                ...calStyles.dayCell,
                zIndex: cellZIndex // 여기서 z-index 강제 지정
            }}
            onClick={() => handleDateClick(dateStr, dayEvents)}
        >
          <div style={calStyles.dayNum}>{d}</div>
          <div style={calStyles.eventList}>
            {Array.from({ length: Math.min(maxLane + 1, MAX_VISIBLE) }, (_, lane) => {
              const ev = dayEvents.find(e => (laneOf.get(e.id) ?? 0) === lane);
              if (!ev) {
                // 이 줄에 해당하는 일정이 이 날짜엔 없음 → 빈 칸으로 줄만 맞춤
                return <div key={`empty-lane-${lane}`} style={calStyles.eventItem} />;
              }
              const isManual = ev.source === 'manual';
              // 걸쳐 있는 모든 날짜에 표시하되, 시작/끝만 둥글게 하여 하나의 띠로 이어 보이게
              const isStart = ev.start_date === dateStr;
              const isEnd = ev.end_date === dateStr;
              const theme = isManual
                ? { bg: '#fff3e0', text: '#e65100', bar: '#e65100' } // 학과 (주황)
                : isHoliday(ev.title)
                ? { bg: '#e8f5e9', text: '#2e7d32', bar: '#2e7d32' } // 대한민국 휴일 (초록)
                : { bg: '#e3f2fd', text: '#1565c0', bar: '#1565c0' }; // 학교 (파랑)
              const itemStyle = {
                  backgroundColor: theme.bg,
                  color: theme.text,
                  borderLeft: isStart ? `4px solid ${theme.bar}` : 'none',
                  borderTopLeftRadius: isStart ? '4px' : 0, borderBottomLeftRadius: isStart ? '4px' : 0,
                  borderTopRightRadius: isEnd ? '4px' : 0, borderBottomRightRadius: isEnd ? '4px' : 0,
                  marginLeft: isStart ? '2px' : 0, marginRight: isEnd ? '2px' : 0,
                  paddingLeft: '4px',
                  width: '100%',
                  zIndex: 10,
                  position: 'relative'
              };
              // 시작일 / 매주 시작(일요일) / 달의 첫날에 제목 표시
              // → 주・달이 넘어가도, 이전 달에서 이어진 일정이라도 무슨 일정인지 바로 보이게
              const showTitle = isStart || currentDayOfWeek === 0 || d === 1;
              return (
                <div key={`${ev.id}-${d}`} style={{...calStyles.eventItem, ...itemStyle}}>
                  {showTitle ? ev.title : ''}
                </div>
              );
            })}

            {hiddenCount > 0 && (
                <div style={calStyles.moreBtn}>+{hiddenCount}</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatHeaderDate = (dateStr) => {
    if(!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate('/student/main')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <MdChevronLeft size={20} /> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>학사 일정</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {/* 컨트롤러 */}
        <div style={calStyles.controls}>
          <div style={calStyles.monthNav}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={prevMonth} style={calStyles.navBtn}><MdChevronLeft size={18} /></motion.button>
            <h3 style={{margin:0, fontSize: 'clamp(18px, 4vw, 22px)'}}>
                {currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}
            </h3>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} onClick={nextMonth} style={calStyles.navBtn}><MdChevronRight size={18} /></motion.button>
          </div>
          
          <div style={calStyles.legend}>
            <div style={calStyles.legendItem}>
              <div style={{width:'10px', height:'10px', backgroundColor:'#1565c0', borderRadius:'2px'}}></div>
              <span>학교</span>
            </div>
            <div style={calStyles.legendItem}>
              <div style={{width:'10px', height:'10px', backgroundColor:'#ff9800', borderRadius:'2px'}}></div>
              <span>학과</span>
            </div>
            <div style={calStyles.legendItem}>
              <div style={{width:'10px', height:'10px', backgroundColor:'#2e7d32', borderRadius:'2px'}}></div>
              <span>휴일</span>
            </div>
          </div>
        </div>

        {/* 달력 영역 */}
        <div style={calStyles.calendarWrapper}>
            <div style={calStyles.dayHeaderRow}>
                {['일','월','화','수','목','금','토'].map((day, idx) => (
                    <div key={day} style={{
                        ...calStyles.dayHeader, 
                        color: idx===0?'#d32f2f': idx===6?'#1976d2':'#333'
                    }}>
                        {day}
                    </div>
                ))}
            </div>
            
            <div style={calStyles.calendarGrid}>
                {renderCalendar()}
            </div>
        </div>

      </div>

      {/* 상세 모달 */}
      <AnimatedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        overlayStyle={modalStyles.overlay}
        modalStyle={modalStyles.modal}
      >
          <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675'}}>{formatHeaderDate(selectedDate)}</h3>
              <button onClick={() => setIsModalOpen(false)} style={modalStyles.closeBtn}><MdClose size={20} /></button>
          </div>
          <div style={modalStyles.list}>
              {selectedEvents.length === 0 ? (
                  <p style={{textAlign:'center', color:'#999', padding:'20px'}}>등록된 일정이 없습니다.</p>
              ) : (
                  selectedEvents.map((ev) => {
                      const isManual = ev.source === 'manual';
                      const borderColor = isManual ? '#ff9800' : isHoliday(ev.title) ? '#2e7d32' : '#1565c0';
                      return (
                          <div key={ev.id} style={{
                              ...modalStyles.item,
                              borderLeft: `4px solid ${borderColor}`
                          }}>
                              <div style={{fontWeight:'bold', fontSize:'16px', color:'#333'}}>{ev.title}</div>
                              <div style={{fontSize:'13px', color:'#666', marginTop:'4px'}}>
                                  {ev.start_date} ~ {ev.end_date}
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </AnimatedModal>
    </div>
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
    padding: '0 15px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '50px',
    flexShrink: 0
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px', 
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(5px)',
    transition: 'all 0.2s ease',
    outline: 'none',
    whiteSpace: 'nowrap'
  },
  glassContainer: {
    flex: 1,
    margin: '15px', 
    padding: 'clamp(15px, 3vw, 40px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
};

const calStyles = {
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap', 
    gap: '5px',
    flexShrink: 0
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  navBtn: {
    background:'white',
    border:'1px solid #ddd',
    borderRadius:'8px',
    cursor:'pointer',
    padding:'6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#003675',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  legend: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: '4px 8px',
    borderRadius: '15px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  calendarWrapper: {
    flex: 1, 
    borderRadius: '10px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden' 
  },
  
  dayHeaderRow: {
    display: 'grid', 
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #eee',
    height: '30px' 
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight:'1px solid #eee',
    fontWeight:'bold',
    fontSize: 'clamp(12px, 1vw, 16px)'
  },

  calendarGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(7, 1fr)', 
    flex: 1, 
    gridAutoRows: '1fr', 
    width: '100%',
    boxSizing: 'border-box'
  },
  
  dayCell: { 
    borderRight:'1px solid #eee', 
    borderBottom:'1px solid #eee', 
    backgroundColor: 'white', 
    display:'flex', 
    flexDirection:'column', 
    cursor: 'pointer', 
    overflow: 'visible', 
    position: 'relative'
  },
  dayCellEmpty: { 
    backgroundColor: '#fafafa', 
    borderRight:'1px solid #eee', 
    borderBottom:'1px solid #eee' 
  },
  dayNum: {
      fontSize: 'clamp(12px, 1vw, 16px)',
      fontWeight: 'bold',
      padding: '4px',
      color: '#444'
  },

  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    width: '100%',
    position: 'absolute',
    top: 'clamp(24px, 2.2vw, 30px)',
    left: 0,
    right: 0,
    overflow: 'visible'
  },

  eventItem: {
    fontSize: 'clamp(10px, 0.9vw, 14px)',
    padding: '1px 3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
    margin: '0 1px',
    lineHeight: '1.2',
    height: 'clamp(16px, 1.6vw, 22px)',
    boxSizing: 'border-box' // 테두리 포함 사이즈 계산
  },
  moreBtn: {
      fontSize: 'clamp(9px, 0.8vw, 12px)',
      color: '#888',
      paddingLeft: '4px',
      fontWeight: 'bold',
      marginTop: '0px'
  }
};

const modalStyles = {
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 
  },
  modal: { 
    width: '85%', maxWidth:'400px', maxHeight: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: '16px', 
    padding: '0', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden'
  },
  header: { 
    padding: '15px 20px', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottom: '1px solid #eee'
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' },
  list: { 
      padding: '20px', 
      overflowY: 'auto',
      flex: 1 
  },
  item: { 
      padding: '12px', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0'
  }
};

export default StudentCalendar;