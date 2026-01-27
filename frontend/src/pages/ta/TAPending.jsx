// src/pages/ta/TAPending.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';

function TAPending() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({}); 
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState(null); 
  const [sortType, setSortType] = useState('latest'); 

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const resInq = await axios.get('http://13.219.208.109:8000/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      const pendingList = resInq.data.filter(item => item.status !== 'COMPLETED' && item.status !== '답변 완료');
      
      const resEvents = await axios.get('http://13.219.208.109:8000/academic-events');
      const eventMap = {};
      resEvents.data.forEach(ev => { eventMap[ev.id] = ev; });
      setAcademicEvents(eventMap);

      setInquiries(sortList(pendingList, 'latest', eventMap));
    } catch (error) {
      if (error.response && error.response.status === 401) { localStorage.clear(); navigate('/'); }
    }
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

  const handleSortChange = (type) => {
    setSortType(type);
    setInquiries(prev => sortList(prev, type, academicEvents));
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry(response.data);
      setReplyContent("");
      setReplyFile(null); 
    } catch (error) { alert("내용 로딩 실패"); }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) { alert("답변 내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('content', replyContent);
    if (replyFile) formData.append('file', replyFile);

    try {
      await axios.post(`http://13.219.208.109:8000/inquiries/${selectedInquiry.id}/replies`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("답변이 등록되었습니다!");
      setSelectedInquiry(null);
      fetchData(); 
    } catch (error) { alert("등록 실패"); }
  };

  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>대기중인 문의</div>

        {/* 정렬 바 */}
        <div style={styles.sortBar}>
            <button onClick={() => handleSortChange('deadline')} style={sortType === 'deadline' ? styles.activeSortBtn : styles.sortBtn}>📅 학사일정 마감순</button>
            <button onClick={() => handleSortChange('latest')} style={sortType === 'latest' ? styles.activeSortBtn : styles.sortBtn}>⬇ 최신순</button>
            <button onClick={() => handleSortChange('old')} style={sortType === 'old' ? styles.activeSortBtn : styles.sortBtn}>⬆ 오래된순</button>
        </div>

        {/* 목록 */}
        <div style={styles.listArea}>
            {inquiries.length === 0 ? (
                <div style={styles.emptyMessage}>대기 중인 문의가 없습니다. 🎉</div>
            ) : (
                inquiries.map((item) => {
                    const eventInfo = item.academic_event_id ? academicEvents[item.academic_event_id] : null;
                    return (
                        <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
                            <div style={styles.cardHeader}>
                                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                    <span style={styles.statusBadge}>답변 대기</span>
                                    {eventInfo && <span style={styles.eventBadge}>D-day: {eventInfo.end_date}</span>}
                                </div>
                                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                            </div>
                            <div style={styles.title}>{item.title}</div>
                            {eventInfo && <div style={styles.relatedEvent}>📌 관련 일정: {eventInfo.title}</div>}
                            <div style={styles.writerInfo}>
                                {item.author_info ? `${item.author_info.department} ${item.author_info.grade}학년 ${item.author_info.name}` : `ID: ${item.user_id}`}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* 모달 */}
      {selectedInquiry && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675'}}>답변 작성하기</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            
            <div style={modalStyles.content}>
              
              {/* 질문 박스 (베이지색) */}
              <div style={modalStyles.questionBox}>
                
                {/* 1. 작성자(학생) 정보 복구 */}
                <div style={{fontSize:'14px', color:'#555', marginBottom:'12px', borderBottom:'1px dashed #ddd', paddingBottom:'8px'}}>
                    <span style={{marginRight:'5px'}}>👤</span> 
                    <span style={{fontWeight:'bold'}}>학생 정보: </span>
                    {selectedInquiry.author_info ? (
                        <span>
                            {selectedInquiry.author_info.department} / {selectedInquiry.author_info.grade}학년 / <span style={{fontWeight:'bold', color:'#333'}}>{selectedInquiry.author_info.name}</span> ({selectedInquiry.author_info.student_no})
                        </span>
                    ) : (
                        <span>ID: {selectedInquiry.user_id}</span>
                    )}
                </div>

                <div style={modalStyles.qTitle}>{selectedInquiry.title}</div>
                <div style={modalStyles.qText}>{selectedInquiry.content}</div>
                
                {selectedInquiry.attachment && (
                    <div style={{marginTop:'15px', backgroundColor:'white', padding:'8px', borderRadius:'6px', border:'1px solid #eee', display:'inline-block'}}>
                        <a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noreferrer" style={modalStyles.fileLink}>📎 학생 첨부파일 다운로드 / 보기</a>
                    </div>
                )}

                {/* 2. 관련 학사일정 정보 복구 */}
                {selectedInquiry.academic_event_id && academicEvents[selectedInquiry.academic_event_id] && (
                    <div style={{marginTop:'15px', padding:'10px', backgroundColor:'#fff3e0', borderRadius:'8px', color:'#e65100', fontSize:'14px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'6px'}}>
                        <span>📅</span>
                        <span>관련 일정: {academicEvents[selectedInquiry.academic_event_id].title} (~{academicEvents[selectedInquiry.academic_event_id].end_date})</span>
                    </div>
                )}
              </div>

              {/* 답변 작성 영역 */}
              <div style={modalStyles.answerArea}>
                <div style={{fontWeight:'bold', marginBottom:'8px', color:'#333'}}>A. 답변 입력</div>
                <textarea style={modalStyles.textarea} placeholder="답변을 입력하세요." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}/>
                
                <div style={{marginTop:'10px'}}>
                    <div style={{fontSize:'13px', fontWeight:'bold', marginBottom:'4px', color:'#555'}}>📎 답변 첨부파일 (선택)</div>
                    <input type="file" onChange={(e) => setReplyFile(e.target.files[0])} style={modalStyles.fileInput}/>
                </div>
              </div>

              <button style={modalStyles.submitBtn} onClick={handleSubmitReply}>답변 등록</button>
            </div>
          </div>
        </div>
      )}
    </TALayout>
  );
}

const styles = {
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '30px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  sortBar: { display: 'flex', gap: '8px', marginBottom: '15px' },
  sortBtn: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#555' },
  activeSortBtn: { padding: '8px 12px', border: '1px solid #003675', borderRadius: '20px', background: '#003675', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#666', fontWeight:'bold' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '5px solid #ff9800' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  statusBadge: { color: '#ff9800', fontWeight: 'bold', fontSize: '12px', backgroundColor:'#fff3e0', padding:'2px 6px', borderRadius:'4px' },
  eventBadge: { backgroundColor: '#ffe0b2', color: '#e65100', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', fontWeight:'bold' },
  date: { color: '#999', fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'5px' },
  relatedEvent: { fontSize: '13px', color: '#e65100', marginTop: '4px', fontWeight:'500' },
  writerInfo: { fontSize: '13px', color: '#555', marginTop: '8px', backgroundColor: '#f5f5f5', padding: '5px 8px', borderRadius: '6px', display: 'inline-block' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth:'650px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' },
  header: { padding: '15px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color:'#666' },
  content: { padding: '25px', overflowY: 'auto', flex: 1, backgroundColor:'#fff' },
  questionBox: { marginBottom: '25px', padding: '20px', backgroundColor: '#fff8e1', borderRadius: '12px', border:'1px solid #ffe0b2' },
  qTitle: { fontWeight: 'bold', marginBottom: '10px', fontSize: '18px', color:'#333' },
  qText: { fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color:'#444' },
  fileLink: { color:'#003675', fontWeight:'bold', textDecoration:'none', fontSize:'14px' },
  answerArea: { marginBottom:'20px' },
  textarea: { width: '100%', minHeight: '150px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px', resize: 'none', boxSizing: 'border-box', lineHeight:'1.5' },
  fileInput: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f9f9f9' },
  submitBtn: { width: '100%', padding: '15px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 54, 117, 0.2)' }
};

export default TAPending;