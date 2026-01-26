// src/pages/student/StudentCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.get('http://localhost:8000/academic-events');
      setEvents(response.data);
    } catch (error) {
      console.error("일정 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []); 

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

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // 1. 빈 칸 (z-index 설정으로 가림 방지)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{...calStyles.dayCellEmpty, zIndex: 100}}></div>);
    }

    // 2. 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const currentDayOfWeek = new Date(year, month, d).getDay(); 

      let dayEvents = events.filter(ev => {
        return ev.start_date <= dateStr && ev.end_date >= dateStr;
      });

      // 정렬 (시작일 빠른 순 -> 긴 일정 우선 -> 제목 순)
      dayEvents.sort((a, b) => {
        if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
        
        const durationA = getDiffDays(a.start_date, a.end_date);
        const durationB = getDiffDays(b.start_date, b.end_date);
        if (durationA !== durationB) return durationB - durationA; 
        
        return a.title.localeCompare(b.title);
      });

      const MAX_VISIBLE = 4; 
      const visibleList = dayEvents.slice(0, MAX_VISIBLE);
      const hiddenCount = dayEvents.length - MAX_VISIBLE;

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
            {visibleList.map((ev, idx) => {
              const isManual = ev.source === 'manual';
              
              const daysLeftInWeek = 6 - currentDayOfWeek; 
              
              const isStartOfEvent = ev.start_date === dateStr;
              const isSunday = currentDayOfWeek === 0;
              const shouldRenderBar = isStartOfEvent || isSunday;

              const remainingDaysTotal = getDiffDays(dateStr, ev.end_date);
              const span = Math.min(remainingDaysTotal, daysLeftInWeek + 1);
              
              const isEndOfEvent = remainingDaysTotal <= (daysLeftInWeek + 1);

              // 색상 정의
              const theme = isManual 
                ? { bg: '#fff3e0', text: '#e65100', bar: '#e65100' } // 학과 (주황)
                : { bg: '#e3f2fd', text: '#1565c0', bar: '#1565c0' }; // 학교 (파랑)

              // 스타일 계산 (띠 & 둥근 모서리)
              const itemStyle = {
                  backgroundColor: theme.bg,
                  color: theme.text,
                  borderLeft: isStartOfEvent ? `4px solid ${theme.bar}` : 'none',
                  borderTopLeftRadius: isStartOfEvent ? '4px' : '0',
                  borderBottomLeftRadius: isStartOfEvent ? '4px' : '0',
                  borderTopRightRadius: isEndOfEvent ? '4px' : '0',
                  borderBottomRightRadius: isEndOfEvent ? '4px' : '0',
                  paddingLeft: isStartOfEvent ? '4px' : '8px'
              };

              if (shouldRenderBar) {
                return (
                  <div key={`${ev.id}-${d}-${idx}`} style={{
                    ...calStyles.eventItem,
                    ...itemStyle,
                    width: `calc(${span * 100}% + ${span - 1}px)`, 
                    zIndex: 10, 
                    position: 'relative',
                    opacity: 1 
                  }}>
                    {ev.title}
                  </div>
                );
              } else {
                // 투명 Spacer
                return (
                  <div key={`${ev.id}-${d}-${idx}`} style={{
                    ...calStyles.eventItem,
                    ...itemStyle,
                    borderLeft: 'none',
                    backgroundColor: 'transparent',
                    color: 'transparent',
                    opacity: 0, 
                    pointerEvents: 'none' 
                  }}>
                    {ev.title}
                  </div>
                );
              }
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
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>학사 일정</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {/* 컨트롤러 */}
        <div style={calStyles.controls}>
          <div style={calStyles.monthNav}>
            <button onClick={prevMonth} style={calStyles.navBtn}>◀</button>
            <h3 style={{margin:0, fontSize: 'clamp(18px, 4vw, 22px)'}}>
                {currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}
            </h3>
            <button onClick={nextMonth} style={calStyles.navBtn}>▶</button>
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
      {isModalOpen && (
        <div style={modalStyles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3 style={{margin:0, color:'#003675'}}>{formatHeaderDate(selectedDate)}</h3>
                    <button onClick={() => setIsModalOpen(false)} style={modalStyles.closeBtn}>✕</button>
                </div>
                <div style={modalStyles.list}>
                    {selectedEvents.length === 0 ? (
                        <p style={{textAlign:'center', color:'#999', padding:'20px'}}>등록된 일정이 없습니다.</p>
                    ) : (
                        selectedEvents.map((ev) => {
                            const isManual = ev.source === 'manual';
                            return (
                                <div key={ev.id} style={{
                                    ...modalStyles.item, 
                                    borderLeft: isManual ? '4px solid #ff9800' : '4px solid #1565c0'
                                }}>
                                    <div style={{fontWeight:'bold', fontSize:'16px', color:'#333'}}>{ev.title}</div>
                                    <div style={{fontSize:'13px', color:'#666', marginTop:'4px'}}>
                                        📅 {ev.start_date} ~ {ev.end_date}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      )}
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
    padding:'4px 8px', 
    fontSize:'12px',
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
    fontSize: '12px'
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
      fontSize: '12px', 
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
    top: '25px', 
    left: 0,
    right: 0,
    overflow: 'visible'
  },
  
  eventItem: { 
    fontSize: '10px', 
    padding: '1px 3px',
    whiteSpace: 'nowrap', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis',
    fontWeight: '500',
    margin: '0 1px',
    lineHeight: '1.2',
    height: '16px',
    boxSizing: 'border-box' // 테두리 포함 사이즈 계산
  },
  moreBtn: { 
      fontSize: '9px', 
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