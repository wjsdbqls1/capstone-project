// src/pages/ta/TACalendarManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css';

function TACalendarManage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [academicEvents, setAcademicEvents] = useState([]);
  const [myMemos, setMyMemos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);       
  const [selectedItems, setSelectedItems] = useState([]);     
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
  const [memoInput, setMemoInput] = useState("");
  const [newEvent, setNewEvent] = useState({ title: '', start_date: '', end_date: '' });
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const eventRes = await axios.get('http://13.219.208.109:8000/academic-events');
      setAcademicEvents(eventRes.data);
      if (token) {
        const memoRes = await axios.get('http://13.219.208.109:8000/memos', { headers: { Authorization: `Bearer ${token}` } });
        setMyMemos(memoRes.data);
      }
    } catch (error) { console.error("로딩 실패:", error); }
  };

  useEffect(() => { fetchData(); }, [currentDate]);

  const handleDateClick = (dateStr, items) => { setSelectedDate(dateStr); setSelectedItems(items); setMemoInput(""); setIsDetailModalOpen(true); };
  const handleAddMemo = async () => {
    if (!memoInput.trim()) return;
    try {
        await axios.post('http://13.219.208.109:8000/memos', { memo_date: selectedDate, content: memoInput }, { headers: { Authorization: `Bearer ${token}` } });
        setMemoInput(""); await fetchData(); updateSelectedItems(selectedDate);
    } catch (err) { alert("실패"); }
  };
  const handleDeleteMemo = async (id) => {
    if(!window.confirm("삭제?")) return;
    try { await axios.delete(`http://13.219.208.109:8000/memos/${id}`, { headers: { Authorization: `Bearer ${token}` } }); await fetchData(); updateSelectedItems(selectedDate); } catch (err) {}
  };
  const handleRegister = async () => {
    if(!newEvent.title || !newEvent.start_date || !newEvent.end_date) return;
    try { await axios.post('http://13.219.208.109:8000/academic-events', newEvent); alert("등록됨"); setIsRegisterModalOpen(false); setNewEvent({ title: '', start_date: '', end_date: '' }); fetchData(); } catch (error) { alert("실패"); }
  };

  const updateSelectedItems = (dateStr) => {
    const dayEvents = academicEvents.filter(ev => ev.start_date <= dateStr && ev.end_date >= dateStr);
    const dayMemos = myMemos.filter(m => m.memo_date === dateStr).map(m => ({...m, type:'memo', title: m.content}));
    setSelectedItems([...dayEvents, ...dayMemos]);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const getDiffDays = (s, e) => Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} style={{...calStyles.dayCellEmpty}}></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const currentDayOfWeek = new Date(year, month, d).getDay();
      let dayEvents = academicEvents.filter(ev => ev.start_date <= dateStr && ev.end_date >= dateStr);
      let dayMemos = myMemos.filter(m => m.memo_date === dateStr).map(m => ({ id: `memo-${m.id}`, title: ` ${m.content}`, start_date: m.memo_date, end_date: m.memo_date, type: 'memo' }));
      let allItems = [...dayEvents, ...dayMemos];
      allItems.sort((a, b) => {
        if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
        const durationA = getDiffDays(a.start_date, a.end_date);
        const durationB = getDiffDays(b.start_date, b.end_date);
        if (durationA !== durationB) return durationB - durationA; 
        return a.title.localeCompare(b.title);
      });
      const visibleList = allItems.slice(0, 3); // 모바일 공간 고려하여 3개
      const hiddenCount = allItems.length - 3;

      days.push(
        <div key={d} style={{...calStyles.dayCell, zIndex: 50 - d}} onClick={() => handleDateClick(dateStr, allItems)}>
          <div style={calStyles.dayNum}>{d}</div>
          <div style={calStyles.eventList}>
            {visibleList.map((ev, idx) => {
                const isManual = ev.source === 'manual';
                const isMemo = ev.type === 'memo';
                const isStartOfEvent = ev.start_date === dateStr;
                const shouldRenderBar = isStartOfEvent || currentDayOfWeek === 0;
                const remainingDaysTotal = getDiffDays(dateStr, ev.end_date);
                const span = Math.min(remainingDaysTotal, (6 - currentDayOfWeek) + 1);
                const isEndOfEvent = remainingDaysTotal <= ((6 - currentDayOfWeek) + 1);
                
                const theme = isMemo ? { bg:'#e8f5e9', text:'#2e7d32', bar:'#2e7d32' } : isManual ? { bg:'#fff3e0', text:'#e65100', bar:'#e65100' } : { bg:'#e3f2fd', text:'#1565c0', bar:'#1565c0' };
                const itemStyle = { backgroundColor: theme.bg, color: theme.text, borderLeft: isStartOfEvent ? `3px solid ${theme.bar}` : 'none', borderTopLeftRadius: isStartOfEvent?'4px':'0', borderBottomLeftRadius: isStartOfEvent?'4px':'0', borderTopRightRadius: isEndOfEvent?'4px':'0', borderBottomRightRadius: isEndOfEvent?'4px':'0', paddingLeft: isStartOfEvent?'4px':'8px' };
                
                return shouldRenderBar ? (
                    <div key={`${ev.id}-${d}-${idx}`} style={{...calStyles.eventItem, ...itemStyle, width: `calc(${span * 100}% + ${span - 1}px)`, zIndex: 10, position: 'relative'}}>{ev.title}</div>
                ) : <div key={`${ev.id}-${d}-${idx}`} style={{...calStyles.eventItem, opacity:0, pointerEvents:'none'}}>{ev.title}</div>;
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
    <TALayout>
      <div style={styles.pageTitle}>캘린더 관리</div>
      <div style={calStyles.controls}>
        <div style={calStyles.monthNav}>
          <button onClick={prevMonth} style={calStyles.navBtn}>◀</button>
          <h3 style={{margin:0, fontSize:'20px', fontWeight:'800', color:'#333'}}>{currentDate.getFullYear()}. {String(currentDate.getMonth() + 1).padStart(2, '0')}</h3>
          <button onClick={nextMonth} style={calStyles.navBtn}>▶</button>
        </div>
        <button onClick={() => setIsRegisterModalOpen(true)} style={calStyles.addBtn}>+ 일정 등록</button>
      </div>
      
      {/* 캘린더 영역 */}
      <div style={calStyles.calendarWrapper}>
          {/* 요일 헤더 */}
          <div style={calStyles.dayHeaderRow}>
            {['일','월','화','수','목','금','토'].map((day, idx) => (
                <div key={day} style={{...calStyles.dayHeader, color: idx===0?'#d32f2f': idx===6?'#1976d2':'#333'}}>{day}</div>
            ))}
          </div>
          {/* 날짜 그리드 */}
          <div style={calStyles.calendarGrid}>
            {renderCalendar()}
          </div>
      </div>

      {isDetailModalOpen && (
        <div style={modalStyles.overlay} onClick={() => setIsDetailModalOpen(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={modalStyles.header}><h3 style={{margin:0, color:'#003675'}}>{selectedDate} 일정</h3><button onClick={() => setIsDetailModalOpen(false)} style={modalStyles.closeBtn}>✕</button></div>
                <div style={modalStyles.list}>
                    <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
                        <input value={memoInput} onChange={(e) => setMemoInput(e.target.value)} placeholder="새로운 메모 입력..." style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}}/>
                        <button onClick={handleAddMemo} style={{padding:'0 15px', backgroundColor:'#2e7d32', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>추가</button>
                    </div>
                    {selectedItems.length === 0 ? <p style={{textAlign:'center', color:'#999'}}>일정이 없습니다.</p> : selectedItems.map((ev, idx) => (
                        <div key={idx} style={{...modalStyles.item, borderLeft: ev.type==='memo' ? '4px solid #2e7d32' : ev.source==='manual' ? '4px solid #ff9800' : '4px solid #1565c0', backgroundColor: ev.type==='memo' ? '#f1f8e9' : 'white'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                <div><div style={{fontWeight:'bold', fontSize:'15px', color:'#333'}}>{ev.title}</div>{ev.type!=='memo' && <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>{ev.start_date} ~ {ev.end_date}</div>}</div>
                                {ev.type==='memo' && <button onClick={() => handleDeleteMemo(ev.id.replace('memo-',''))} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}>🗑️</button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
      {isRegisterModalOpen && (
        <div style={modalStyles.overlay}><div style={modalStyles.modal}><div style={modalStyles.header}><h3 style={{margin:0}}>학과 일정 등록</h3><button onClick={() => setIsRegisterModalOpen(false)} style={modalStyles.closeBtn}>✕</button></div><div style={{padding:'20px'}}><div style={modalStyles.inputGroup}><label style={modalStyles.label}>일정 제목</label><input placeholder="예: 수강신청 기간" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={modalStyles.input}/></div><div style={modalStyles.inputGroup}><label style={modalStyles.label}>시작 날짜</label><input type="date" value={newEvent.start_date} onChange={e => setNewEvent({...newEvent, start_date: e.target.value})} style={modalStyles.input}/></div><div style={modalStyles.inputGroup}><label style={modalStyles.label}>종료 날짜</label><input type="date" value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date: e.target.value})} style={modalStyles.input}/></div><div style={modalStyles.btnGroup}><button onClick={() => setIsRegisterModalOpen(false)} style={modalStyles.cancelBtn}>취소</button><button onClick={handleRegister} style={modalStyles.submitBtn}>등록하기</button></div></div></div></div>
      )}
    </TALayout>
  );
}

const styles = { pageTitle: { fontSize: '22px', fontWeight: '800', color: '#003675', marginBottom: '15px' } };

const calStyles = { 
    controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }, 
    monthNav: { display: 'flex', alignItems: 'center', gap: '10px' }, 
    navBtn: { background:'white', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', padding:'6px 12px', fontSize:'14px', fontWeight:'bold' }, 
    addBtn: { backgroundColor: '#ff9800', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }, 
    
    // [중요] 모바일 대응: 최소 너비를 주어 가로 스크롤이 생기도록 함
    calendarWrapper: { 
        flex: 1, 
        borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.8)', 
        backgroundColor: 'white', 
        display: 'flex', 
        flexDirection: 'column', 
        overflowX: 'auto', // 가로 스크롤 허용
        overflowY: 'hidden',
        minHeight: '400px',
        WebkitOverflowScrolling: 'touch' // 모바일 부드러운 스크롤
    }, 
    
    // [중요] 그리드에 최소 너비(minWidth)를 주어 찌그러짐 방지
    dayHeaderRow: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        backgroundColor: 'rgba(0,0,0,0.05)', 
        borderBottom: '1px solid rgba(255,255,255,0.6)', 
        height: '35px',
        minWidth: '600px' // 최소 너비 설정
    }, 
    dayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight:'1px solid rgba(255,255,255,0.6)', fontWeight:'bold', fontSize: '14px' }, 
    
    calendarGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        flex: 1, 
        gridAutoRows: '1fr', 
        width: '100%', 
        boxSizing: 'border-box',
        minWidth: '600px' // 최소 너비 설정
    }, 
    
    dayCell: { borderRight:'1px solid rgba(202, 200, 200, 0.6)', borderBottom:'1px solid rgba(202, 200, 200, 0.6)', backgroundColor: 'transparent', display:'flex', flexDirection:'column', cursor: 'pointer', overflow: 'visible', position: 'relative', minHeight: '100px' }, 
    dayCellEmpty: { backgroundColor: 'rgba(0,0,0,0.02)', borderRight:'1px solid rgba(202, 200, 200, 0.6)', borderBottom:'1px solid rgba(202, 200, 200, 0.6)' }, 
    
    dayNum: { fontSize: '16px', fontWeight: 'bold', padding: '6px', color: '#333' }, 
    eventList: { display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', position: 'absolute', top: '30px', left: 0, right: 0, overflow: 'visible' }, 
    eventItem: { fontSize: '12px', padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', margin: '0 2px', lineHeight: '1.2', height: '20px', borderRadius:'4px' }, 
    moreBtn: { fontSize: '11px', color: '#666', paddingLeft: '4px', fontWeight: 'bold' } 
};

const modalStyles = { overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }, modal: { width: '85%', maxWidth:'400px', maxHeight: '80%', backgroundColor: 'white', borderRadius: '16px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }, header: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }, closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }, list: { padding: '20px', overflowY: 'auto', flex: 1 }, item: { padding: '12px', backgroundColor: 'white', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }, inputGroup: { marginBottom: '15px' }, label: { fontSize: '13px', color: '#666', fontWeight:'bold', marginBottom:'5px', display:'block' }, input: { width: '100%', padding: '10px', boxSizing:'border-box', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }, btnGroup: { display: 'flex', gap: '10px', marginTop: '20px' }, cancelBtn: { flex: 1, padding: '12px', border: '1px solid #ddd', backgroundColor:'white', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', color:'#666' }, submitBtn: { flex: 1, padding: '12px', border: 'none', backgroundColor:'#ff9800', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color:'white' } };

export default TACalendarManage;