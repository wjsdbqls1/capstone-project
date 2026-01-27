// src/pages/ta/TACompleted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css'; 

function TACompleted() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => { fetchInquiries(); }, []);

  useEffect(() => {
    let result = [...inquiries];
    if (searchTerm) result = result.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) || (item.author_info && item.author_info.name.includes(searchTerm)));
    if (gradeFilter !== "all") result = result.filter(item => item.author_info && item.author_info.grade === parseInt(gradeFilter));
    if (dateFilter !== "all") {
      const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(item => {
        const itemDate = new Date(item.created_at); const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        if (dateFilter === 'today') return itemDateStart.getTime() === todayStart.getTime();
        if (dateFilter === 'week') { const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); const monday = new Date(now.setDate(diff)); monday.setHours(0,0,0,0); return itemDate >= monday; }
        if (dateFilter === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (dateFilter === 'year') return itemDate.getFullYear() === now.getFullYear();
        return true;
      });
    }
    setFilteredInquiries(result);
  }, [searchTerm, gradeFilter, dateFilter, inquiries]);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get('http://13.219.208.109:8000/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      const completedList = response.data.filter(item => item.status === 'COMPLETED' || item.status === '답변 완료');
      const resEvents = await axios.get('http://13.219.208.109:8000/academic-events');
      const eventMap = {}; resEvents.data.forEach(ev => { eventMap[ev.id] = ev; }); setAcademicEvents(eventMap);
      setInquiries(completedList.sort((a, b) => b.id - a.id)); setFilteredInquiries(completedList.sort((a, b) => b.id - a.id));
    } catch (error) {}
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const qRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const rRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}/replies`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry({ ...qRes.data, replies: rRes.data }); setEditingReplyId(null);
    } catch (error) { alert("로딩 실패"); }
  };

  const handleUpdateReply = async (inquiryId, replyId) => {
    if (!editContent.trim()) { alert("내용 입력 필요"); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData(); formData.append("content", editContent); if (editFile) formData.append("file", editFile);
    try { await axios.put(`http://13.219.208.109:8000/inquiries/${inquiryId}/replies/${replyId}`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }); alert("수정됨"); handleSelect(inquiryId); } catch (error) { alert("실패"); }
  };

  return (
    <TALayout>
      <div style={styles.pageTitle}>처리 완료 문의</div>
      {/* 필터 바: 모바일 대응 (flex-wrap) */}
      <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
              <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">📅 기간</option><option value="today">오늘</option><option value="week">이번 주</option><option value="month">이번 달</option><option value="year">올해</option>
              </select>
              <select style={styles.select} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                  <option value="all">🎓 학년</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
              </select>
          </div>
          <div style={styles.searchWrapper}>
              <span style={{fontSize:'16px', color:'#666'}}>🔍</span>
              <input type="text" placeholder="이름/제목 검색" style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
      </div>
      <div style={styles.listArea}>
        {filteredInquiries.length === 0 ? <div style={styles.emptyMessage}>내역이 없습니다.</div> :
          filteredInquiries.map((item) => (
            <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
              <div style={styles.cardHeader}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={styles.statusDone}>완료</span>
                  {item.author_info && (<span style={styles.nameTag}>{item.author_info.name}</span>)}
                </div>
                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
              </div>
              <h3 style={styles.title}>{item.title}</h3>
              <div style={styles.writerInfo}>{item.author_info ? `${item.author_info.department} ${item.author_info.grade}학년` : `ID: ${item.user_id}`}</div>
            </div>
          ))
        }
      </div>
      {selectedInquiry && (
        <div style={modalStyles.overlay} onClick={() => setSelectedInquiry(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}><h3 style={{margin:0, color:'#2e7d32'}}>문의 상세</h3><button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button></div>
            <div style={modalStyles.content}>
               <div style={modalStyles.questionBox}>
                  <div style={modalStyles.infoRow}><span style={{fontWeight:'bold'}}>👤 학생: </span>{selectedInquiry.author_info ? <span>{selectedInquiry.author_info.department} {selectedInquiry.author_info.name}</span> : <span>{selectedInquiry.user_id}</span>}</div>
                  <div style={modalStyles.qTitle}>Q. {selectedInquiry.title}</div>
                  <div style={modalStyles.qText}>{selectedInquiry.content}</div>
                  {selectedInquiry.attachment && (<div style={modalStyles.attachBox}><a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noreferrer" style={modalStyles.fileLink}>📎 첨부파일</a></div>)}
                  {selectedInquiry.academic_event_id && academicEvents[selectedInquiry.academic_event_id] && (<div style={modalStyles.eventBox}>📅 일정: {academicEvents[selectedInquiry.academic_event_id].title}</div>)}
               </div>
               <hr style={{margin:'20px 0', borderTop:'1px dashed #ddd'}}/>
               <div style={modalStyles.section}>
                  <div style={{fontSize:'16px', fontWeight:'bold', color:'#2e7d32', marginBottom:'10px'}}>A. 답변</div>
                  {selectedInquiry.replies?.map(r => (
                    <div key={r.id} style={modalStyles.answerBox}>
                        {editingReplyId === r.id ? (
                            <div><textarea style={modalStyles.editTextarea} value={editContent} onChange={(e)=>setEditContent(e.target.value)}/><div style={{marginTop:'8px', display:'flex', justifyContent:'flex-end', gap:'8px'}}><button onClick={()=>{setEditingReplyId(null)}} style={modalStyles.cancelBtn}>취소</button><button onClick={()=>handleUpdateReply(selectedInquiry.id, r.id)} style={modalStyles.saveBtn}>저장</button></div></div>
                        ) : (
                            <div><div style={{whiteSpace:'pre-wrap', lineHeight:'1.5', color:'#333'}}>{r.content}</div>{r.attachment && (<div style={{marginTop:'8px'}}><a href={`http://13.219.208.109:8000${r.attachment}`} target="_blank" rel="noreferrer" style={{fontSize:'13px', color:'#2e7d32', fontWeight:'bold'}}>📎 답변 파일</a></div>)}<div style={{marginTop:'10px', textAlign:'right'}}><button onClick={()=>{setEditingReplyId(r.id); setEditContent(r.content);}} style={{fontSize:'12px', border:'none', background:'none', color:'#666'}}>✏️ 수정</button></div></div>
                        )}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#003675', marginBottom: '15px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px', backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' },
  filterGroup: { display: 'flex', gap: '8px', flexWrap:'wrap' },
  select: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', flexGrow: 1, minWidth: '150px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', width: '100%', backgroundColor: 'transparent' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '2px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '15px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.9)', borderLeft: '5px solid #4caf50' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems:'center' },
  statusDone: { color: '#2e7d32', fontWeight: 'bold', fontSize: '11px', backgroundColor:'#e8f5e9', padding:'3px 6px', borderRadius:'4px' },
  nameTag: { fontSize: '12px', fontWeight: 'bold', color: '#495057' },
  date: { color: '#666', fontSize: '11px' },
  title: { fontSize: '15px', fontWeight: 'bold', color:'#212529', marginBottom:'4px' },
  writerInfo: { fontSize: '12px', color: '#495057', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 },
  modal: { width: '90%', maxWidth: '600px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1, backgroundColor:'#fff' },
  questionBox: { padding: '15px', backgroundColor: '#fff8e1', borderRadius: '12px', border:'1px solid #ffe0b2' },
  infoRow: { fontSize:'13px', color:'#555', marginBottom:'10px', borderBottom:'1px dashed #e6cba8', paddingBottom:'8px' },
  qTitle: { fontWeight: 'bold', fontSize: '16px', color:'#333', marginBottom:'8px' },
  qText: { fontSize: '15px', lineHeight: '1.5', color: '#444', whiteSpace: 'pre-wrap' },
  attachBox: { marginTop:'10px', backgroundColor:'white', padding:'8px', borderRadius:'6px', border:'1px solid #eee', display:'inline-block' },
  fileLink: { color:'#003675', fontWeight:'bold', textDecoration:'none', fontSize:'13px' },
  eventBox: { marginTop:'10px', padding:'8px', backgroundColor:'#e8f5e9', borderRadius:'8px', color:'#2e7d32', fontSize:'13px', fontWeight:'bold' },
  section: { marginBottom: '15px' },
  answerBox: { backgroundColor: '#f1f8e9', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #c5e1a5' },
  editTextarea: { width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize:'14px' },
  saveBtn: { padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' },
  cancelBtn: { padding: '8px 16px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' }
};

export default TACompleted;