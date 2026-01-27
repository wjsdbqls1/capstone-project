// src/pages/ta/TACalendarManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function TACalendarManage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 데이터 상태
  const [academicEvents, setAcademicEvents] = useState([]); // 학사 일정
  const [myMemos, setMyMemos] = useState([]); // 조교 개인 메모
  
  // 팝업 상태
  const [selectedDate, setSelectedDate] = useState(null);       
  const [selectedItems, setSelectedItems] = useState([]);     
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 

  // 입력 폼 상태
  const [memoInput, setMemoInput] = useState("");
  const [newEvent, setNewEvent] = useState({ title: '', start_date: '', end_date: '' });

  const token = localStorage.getItem('token');

  // 날짜 포맷 헬퍼
  const formatYmd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 1. 데이터 가져오기
  const fetchData = async () => {
    try {
      const eventRes = await axios.get('http://13.219.208.109:8000/academic-events');
      setAcademicEvents(eventRes.data);

      if (token) {
        const memoRes = await axios.get('http://13.219.208.109:8000/memos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMyMemos(memoRes.data);
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // 2. 날짜 클릭 시 상세 모달 열기
  const handleDateClick = (dateStr, items) => {
    setSelectedDate(dateStr);
    setSelectedItems(items);
    setMemoInput(""); 
    setIsDetailModalOpen(true);
  };

  // 3. 메모 등록
  const handleAddMemo = async () => {
    if (!memoInput.trim()) return;
    try {
        await axios.post('http://13.219.208.109:8000/memos', 
          { memo_date: selectedDate, content: memoInput },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMemoInput("");
        await fetchData();
        updateSelectedItems(selectedDate);
    } catch (err) {
        alert("메모 저장 실패");
    }
  };

  // 4. 메모 삭제
  const handleDeleteMemo = async (id) => {
    if(!window.confirm("삭제하시겠습니까?")) return;
    try {
        await axios.delete(`http://13.219.208.109:8000/memos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        await fetchData();
        updateSelectedItems(selectedDate);
    } catch (err) {
        alert("삭제 실패");
    }
  };

  // 5. 학사 일정 등록
  const handleRegister = async () => {
    if(!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    try {
      await axios.post('http://13.219.208.109:8000/academic-events', newEvent);
      alert("일정이 등록되었습니다!");
      setIsRegisterModalOpen(false);
      setNewEvent({ title: '', start_date: '', end_date: '' });
      fetchData();
    } catch (error) {
      alert("등록 실패");
    }
  };

  const updateSelectedItems = (dateStr) => {
    const dayEvents = academicEvents.filter(ev => ev.start_date <= dateStr && ev.end_date >= dateStr);
    const dayMemos = myMemos.filter(m => m.memo_date === dateStr).map(m => ({...m, type:'memo', title: m.content}));
    setSelectedItems([...dayEvents, ...dayMemos]);
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

  // --- 달력 렌더링 ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // 빈 칸 (z-index 설정으로 가림 방지)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{...calStyles.dayCellEmpty, zIndex: 100}}></div>);
    }

    // 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const currentDayOfWeek = new Date(year, month, d).getDay();

      let dayEvents = academicEvents.filter(ev => 
        ev.start_date <= dateStr && ev.end_date >= dateStr
      );

      let dayMemos = myMemos.filter(m => m.memo_date === dateStr).map(m => ({
        id: `memo-${m.id}`,
        title: ` ${m.content}`,
        start_date: m.memo_date,
        end_date: m.memo_date,
        type: 'memo'
      }));

      let allItems = [...dayEvents, ...dayMemos];

      // ★ 핵심 수정: 정렬 우선순위 변경
      // 1순위: 시작 날짜가 빠른 것 (그래야 먼저 그려진 줄이 유지됨)
      // 2순위: 기간이 긴 것
      // 3순위: 제목 순
      allItems.sort((a, b) => {
        if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
        
        const durationA = getDiffDays(a.start_date, a.end_date);
        const durationB = getDiffDays(b.start_date, b.end_date);
        if (durationA !== durationB) return durationB - durationA; 
        
        return a.title.localeCompare(b.title);
      });

      const MAX_VISIBLE = 4;
      const visibleList = allItems.slice(0, MAX_VISIBLE);
      const hiddenCount = allItems.length - MAX_VISIBLE;

      // ★ Z-Index: 날짜가 빠를수록 높게 (이전 날짜의 막대가 다음 날짜 위로 올라오게 함)
      const cellZIndex = 50 - d; 

      days.push(
        <div 
            key={d} 
            style={{
                ...calStyles.dayCell,
                zIndex: cellZIndex 
            }}
            onClick={() => handleDateClick(dateStr, allItems)}
        >
          <div style={calStyles.dayNum}>{d}</div>
          <div style={calStyles.eventList}>
            {visibleList.map((ev, idx) => {
                const isManual = ev.source === 'manual';
                const isMemo = ev.type === 'memo';
                
                const daysLeftInWeek = 6 - currentDayOfWeek; 
                
                const isStartOfEvent = ev.start_date === dateStr;
                const isSunday = currentDayOfWeek === 0;
                
                const shouldRenderBar = isStartOfEvent || isSunday;

                const remainingDaysTotal = getDiffDays(dateStr, ev.end_date);
                const span = Math.min(remainingDaysTotal, daysLeftInWeek + 1);
                
                const isEndOfEvent = remainingDaysTotal <= (daysLeftInWeek + 1);

                const colorMap = {
                    school: { bg: '#e3f2fd', text: '#1565c0', bar: '#1565c0' },
                    dept:   { bg: '#fff3e0', text: '#e65100', bar: '#e65100' },
                    memo:   { bg: '#e8f5e9', text: '#2e7d32', bar: '#2e7d32' }
                };
                
                let theme = colorMap.school;
                if (isManual) theme = colorMap.dept;
                if (isMemo) theme = colorMap.memo;

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
            {hiddenCount > 0 && <div style={calStyles.moreBtn}>+{hiddenCount}</div>}
          </div>
        </div>
      );
    }
    return days;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div style={styles.pageContainer}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate('/ta/main')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>
        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>캘린더 관리</h2>
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 */}
      <div style={styles.glassContainer}>
        {/* 컨트롤러 */}
        <div style={calStyles.controls}>
          <div style={calStyles.monthNav}>
            <button onClick={prevMonth} style={calStyles.navBtn}>◀</button>
            <h3 style={{margin:0, fontSize:'clamp(18px, 4vw, 22px)'}}>
                {currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}
            </h3>
            <button onClick={nextMonth} style={calStyles.navBtn}>▶</button>
          </div>
          <button onClick={() => setIsRegisterModalOpen(true)} style={calStyles.addBtn}>
            + 학과 일정 등록
          </button>
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

      {/* 상세 보기 & 메모 관리 모달 */}
      {isDetailModalOpen && (
        <div style={modalStyles.overlay} onClick={() => setIsDetailModalOpen(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <h3 style={{margin:0, color:'#003675'}}>{selectedDate} 일정</h3>
                    <button onClick={() => setIsDetailModalOpen(false)} style={modalStyles.closeBtn}>✕</button>
                </div>
                <div style={modalStyles.list}>
                    <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
                        <input 
                            value={memoInput}
                            onChange={(e) => setMemoInput(e.target.value)}
                            placeholder="새로운 메모 입력..."
                            style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}}
                        />
                        <button onClick={handleAddMemo} style={{padding:'0 15px', backgroundColor:'#2e7d32', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>추가</button>
                    </div>
                    {selectedItems.length === 0 ? (
                        <p style={{textAlign:'center', color:'#999', padding:'10px'}}>일정이 없습니다.</p>
                    ) : (
                        selectedItems.map((ev, idx) => {
                            const isManual = ev.source === 'manual';
                            const isMemo = ev.type === 'memo';
                            
                            let cardStyle = { ...modalStyles.item, borderLeft: '4px solid #1565c0' };
                            if(isManual) cardStyle.borderLeft = '4px solid #ff9800';
                            if(isMemo) cardStyle = { ...modalStyles.item, borderLeft: '4px solid #2e7d32', backgroundColor:'#f1f8e9' };

                            return (
                                <div key={idx} style={cardStyle}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                        <div>
                                            <div style={{fontWeight:'bold', fontSize:'15px', color:'#333'}}>
                                                {isMemo ? " " : ""}{ev.title}
                                            </div>
                                            {!isMemo && (
                                                <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>
                                                    {ev.start_date} ~ {ev.end_date}
                                                </div>
                                            )}
                                        </div>
                                        {isMemo && (
                                            <button 
                                                onClick={() => handleDeleteMemo(ev.id.replace('memo-',''))}
                                                style={{background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'16px'}}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 학사 일정 등록 모달 */}
      {isRegisterModalOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
                <h3 style={{margin:0, color:'#000000'}}>학과 일정 등록</h3>
                <button onClick={() => setIsRegisterModalOpen(false)} style={modalStyles.closeBtn}>✕</button>
            </div>
            <div style={{padding:'20px'}}>
                <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>일정 제목</label>
                    <input 
                      placeholder="예: 수강신청 기간"
                      value={newEvent.title}
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      style={modalStyles.input}
                    />
                </div>
                <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>시작 날짜</label>
                    <input 
                      type="date"
                      value={newEvent.start_date}
                      onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                      style={modalStyles.input}
                    />
                </div>
                <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>종료 날짜</label>
                    <input 
                      type="date"
                      value={newEvent.end_date}
                      onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                      style={modalStyles.input}
                    />
                </div>
                <div style={modalStyles.btnGroup}>
                  <button onClick={() => setIsRegisterModalOpen(false)} style={modalStyles.cancelBtn}>취소</button>
                  <button onClick={handleRegister} style={modalStyles.submitBtn}>등록하기</button>
                </div>
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
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)', 
    padding: '10px 15px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '55px',
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
    padding: 'clamp(15px, 3vw, 25px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    overflow: 'hidden', 
    maxWidth: '1000px', 
    width: '95%',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
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
  monthNav: { display: 'flex', alignItems: 'center', gap: '10px' },
  navBtn: { 
    background:'white', border:'1px solid #ddd', borderRadius:'8px', 
    cursor:'pointer', padding:'4px 8px', fontSize:'12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  addBtn: { 
    backgroundColor: '#ff9800', color: 'black', border: 'none', 
    padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', 
    fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },

  calendarWrapper: {
    flex: 1, 
    borderRadius: '12px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '300px'
  },
  dayHeaderRow: {
    display: 'grid', 
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #eee',
    height: '30px'
  },
  dayHeader: { 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRight:'1px solid #eee', fontWeight:'bold', fontSize: '12px'
  },
  calendarGrid: { 
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, 
    gridAutoRows: '1fr', width: '100%', boxSizing: 'border-box'
  },
  
  dayCell: { 
    borderRight:'1px solid #eee', 
    borderBottom:'1px solid #eee', 
    backgroundColor: 'white', 
    display:'flex', flexDirection:'column', 
    cursor: 'pointer', 
    overflow: 'visible', // 이어지게 하기 위해 visible (중요)
    position: 'relative'
  },
  dayCellEmpty: { 
    backgroundColor: '#fafafa', borderRight:'1px solid #eee', borderBottom:'1px solid #eee' 
  },
  dayNum: { fontSize: '12px', fontWeight: 'bold', padding: '4px', color: '#444' },
  
  eventList: { 
    display: 'flex', flexDirection: 'column', gap: '1px', 
    width: '100%', position: 'absolute', top: '25px', left: 0, right: 0,
    overflow: 'visible' 
  },
  
  eventItem: { 
    fontSize: '10px', padding: '1px 3px', 
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontWeight: '500', 
    margin: '0 1px',
    lineHeight: '1.2', height: '16px',
    boxSizing: 'border-box'
  },
  moreBtn: { fontSize: '9px', color: '#888', paddingLeft: '4px', fontWeight: 'bold' }
};

const modalStyles = {
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 
  },
  modal: { 
    width: '85%', maxWidth:'400px', maxHeight: '80%',
    backgroundColor: 'white', 
    borderRadius: '16px', 
    padding: '0', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden'
  },
  header: { 
    padding: '15px 20px', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#f9f9f9',
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
  },
  inputGroup: { marginBottom: '15px' },
  label: { fontSize: '13px', color: '#666', fontWeight:'bold', marginBottom:'5px', display:'block' },
  input: { 
    width: '100%', padding: '10px', boxSizing:'border-box',
    border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px'
  },
  btnGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { 
    flex: 1, padding: '12px', border: '1px solid #ddd', backgroundColor:'white',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color:'#666'
  },
  submitBtn: { 
    flex: 1, padding: '12px', border: 'none', backgroundColor:'#ff9800',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color:'black'
  }
};

export default TACalendarManage;