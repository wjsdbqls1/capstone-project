// src/pages/ta/TAPending.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

function TAPending() {
  const [inquiries, setInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({}); 
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState(null); 
  const [sortType, setSortType] = useState('latest'); 

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const resInq = await axios.get('http://13.219.208.109:8000/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      const pendingList = resInq.data.filter(item => item.status !== 'COMPLETED' && item.status !== '답변 완료');
      const resEvents = await axios.get('http://13.219.208.109:8000/academic-events');
      const eventMap = {}; resEvents.data.forEach(ev => { eventMap[ev.id] = ev; });
      setAcademicEvents(eventMap);
      setInquiries(sortList(pendingList, 'latest', eventMap));
    } catch (error) {}
  };
  useEffect(() => { fetchData(); }, []);

  const sortList = (list, type, eventMap) => {
    const sorted = [...list];
    if (type === 'latest') sorted.sort((a, b) => b.id - a.id);
    else if (type === 'old') sorted.sort((a, b) => a.id - b.id);
    else if (type === 'deadline') {
      sorted.sort((a, b) => {
        const dateA = a.academic_event_id && eventMap[a.academic_event_id] ? eventMap[a.academic_event_id].end_date : '9999-12-31';
        const dateB = b.academic_event_id && eventMap[b.academic_event_id] ? eventMap[b.academic_event_id].end_date : '9999-12-31';
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return b.id - a.id; 
      });
    }
    return sorted;
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry(response.data); setReplyContent(""); setReplyFile(null); 
    } catch (error) { alert("오류 발생"); }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('content', replyContent);
    if (replyFile) formData.append('file', replyFile);
    try {
      await axios.post(`http://13.219.208.109:8000/inquiries/${selectedInquiry.id}/replies`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert("답변 완료"); setSelectedInquiry(null); fetchData(); 
    } catch (error) { alert("등록 실패"); }
  };

  return (
    <TALayout>
      <div style={styles.pageTitle}>대기중인 문의</div>
      <div style={styles.sortBar}>
          <button onClick={() => { setSortType('deadline'); setInquiries(sortList(inquiries, 'deadline', academicEvents)); }} style={sortType === 'deadline' ? styles.activeSortBtn : styles.sortBtn}>📅 마감순</button>
          <button onClick={() => { setSortType('latest'); setInquiries(sortList(inquiries, 'latest', academicEvents)); }} style={sortType === 'latest' ? styles.activeSortBtn : styles.sortBtn}>⬇ 최신순</button>
          <button onClick={() => { setSortType('old'); setInquiries(sortList(inquiries, 'old', academicEvents)); }} style={sortType === 'old' ? styles.activeSortBtn : styles.sortBtn}>⬆ 오래된순</button>
      </div>
      <div style={styles.listArea}>
          {inquiries.length === 0 ? <div style={styles.emptyMessage}>대기 중인 문의가 없습니다. 🎉</div> :
              inquiries.map((item) => {
                  const eventInfo = item.academic_event_id ? academicEvents[item.academic_event_id] : null;
                  return (
                      <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
                          <div style={styles.cardHeader}>
                              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                                  <span style={styles.statusBadge}>답변 대기</span>
                                  {eventInfo && <span style={styles.eventBadge}>D-day: {eventInfo.end_date}</span>}
                              </div>
                              <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                          </div>
                          <div style={styles.title}>{item.title}</div>
                          {eventInfo && <div style={styles.relatedEvent}>📌 {eventInfo.title}</div>}
                          {/* 목록 카드에 학생 정보 복구 */}
                          <div style={styles.writerInfo}>
                              {item.author_info ? `${item.author_info.department} ${item.author_info.grade}학년 ${item.author_info.name} (${item.author_info.student_no})` : `ID: ${item.user_id}`}
                          </div>
                      </div>
                  );
              })
          }
      </div>
      {selectedInquiry && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675'}}>답변 작성</h3><button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            <div style={modalStyles.content}>
              <div style={modalStyles.questionBox}>
                {/* 모달 내 학생 정보 복구 */}
                <div style={modalStyles.infoRow}>
                    <span style={{fontWeight:'bold', marginRight:'5px'}}>👤 학생 정보: </span>
                    {selectedInquiry.author_info ? (
                        <span>{selectedInquiry.author_info.department} / {selectedInquiry.author_info.grade}학년 / <span style={{fontWeight:'bold', color:'#333'}}>{selectedInquiry.author_info.name}</span> ({selectedInquiry.author_info.student_no})</span>
                    ) : (
                        <span>ID: {selectedInquiry.user_id}</span>
                    )}
                </div>
                <div style={modalStyles.qTitle}>{selectedInquiry.title}</div>
                <div style={modalStyles.qText}>{selectedInquiry.content}</div>
                {selectedInquiry.attachment && <div style={modalStyles.attachBox}><a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noreferrer" style={modalStyles.fileLink}>📎 첨부파일 보기</a></div>}
                {selectedInquiry.academic_event_id && academicEvents[selectedInquiry.academic_event_id] && <div style={modalStyles.eventBox}>📅 관련 일정: {academicEvents[selectedInquiry.academic_event_id].title}</div>}
              </div>
              <div style={modalStyles.answerArea}>
                <div style={{fontWeight:'bold', marginBottom:'8px'}}>답변 입력</div>
                <textarea style={modalStyles.textarea} placeholder="내용 입력..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}/>
                <input type="file" onChange={(e) => setReplyFile(e.target.files[0])} style={modalStyles.fileInput}/>
              </div>
              <button style={modalStyles.submitBtn} onClick={handleSubmitReply}>등록</button>
            </div>
          </div>
        </div>
      )}
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#003675', marginBottom: '15px' },
  sortBar: { display: 'flex', gap: '8px', marginBottom: '15px', backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', flexWrap: 'wrap' },
  sortBtn: { padding: '6px 12px', border: '1px solid #ced4da', borderRadius: '20px', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', color: '#495057', fontWeight:'500' },
  activeSortBtn: { padding: '6px 12px', border: '1px solid #003675', borderRadius: '20px', background: '#003675', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '2px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight:'bold' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '15px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.9)', borderLeft: '5px solid #ff9800' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems:'center' },
  statusBadge: { color: '#ff9800', fontWeight: 'bold', fontSize: '11px', backgroundColor:'#fff3e0', padding:'3px 6px', borderRadius:'4px' },
  eventBadge: { backgroundColor: '#ffe0b2', color: '#e65100', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', fontWeight:'bold' },
  date: { color: '#666', fontSize: '11px' },
  title: { fontSize: '15px', fontWeight: 'bold', color:'#212529', marginBottom:'4px' },
  relatedEvent: { fontSize: '12px', color: '#e65100', marginTop: '4px', fontWeight:'500' },
  writerInfo: { fontSize: '12px', color: '#495057', marginTop: '6px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 },
  modal: { width: '90%', maxWidth:'600px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1, backgroundColor:'#fff' },
  questionBox: { marginBottom: '20px', padding: '15px', backgroundColor: '#fff8e1', borderRadius: '12px', border:'1px solid #ffe0b2' },
  infoRow: { fontSize:'13px', color:'#555', marginBottom:'10px', borderBottom:'1px dashed #e6cba8', paddingBottom:'8px' },
  qTitle: { fontWeight: 'bold', marginBottom: '8px', fontSize: '16px', color:'#333' },
  qText: { fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color:'#444' },
  attachBox: { marginTop:'10px', backgroundColor:'white', padding:'8px', borderRadius:'6px', border:'1px solid #eee', display:'inline-block' },
  fileLink: { display:'block', color:'#003675', fontWeight:'bold', textDecoration:'underline', fontSize:'13px' },
  eventBox: { marginTop:'10px', padding:'8px', backgroundColor:'#fff3e0', borderRadius:'8px', color:'#e65100', fontSize:'13px', fontWeight:'bold' },
  answerArea: { marginBottom:'15px' },
  textarea: { width: '100%', minHeight: '120px', padding: '12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '15px', resize: 'none', boxSizing: 'border-box' },
  fileInput: { width: '100%', marginTop:'10px', fontSize:'13px' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop:'10px' }
};

export default TAPending;