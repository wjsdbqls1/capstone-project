// src/pages/ta/TACompleted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';

function TACompleted() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState(null);

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await axios.get('http://13.219.208.109:8000/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      const completedList = response.data.filter(item => item.status === 'COMPLETED' || item.status === '답변 완료');
      setInquiries(completedList.sort((a, b) => b.id - a.id));
    } catch (error) { console.error(error); }
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const qRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const rRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}/replies`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry({ ...qRes.data, replies: rRes.data });
      setEditingReplyId(null);
    } catch (error) { alert("상세 정보를 불러오지 못했습니다."); }
  };

  const handleUpdateReply = async (inquiryId, replyId) => {
    if (!editContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("content", editContent);
    if (editFile) formData.append("file", editFile);

    try {
      await axios.put(`http://13.219.208.109:8000/inquiries/${inquiryId}/replies/${replyId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert("수정되었습니다.");
      handleSelect(inquiryId);
    } catch (error) { alert("수정 실패"); }
  };

  return (
    <TALayout>
        <div style={styles.pageTitle}>처리 완료 문의</div>
        <div style={styles.listArea}>
          {inquiries.length === 0 ? (
            <div style={styles.emptyMessage}>완료된 문의가 없습니다.</div>
          ) : (
            inquiries.map((item) => (
              <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
                <div style={styles.cardHeader}>
                  <span style={styles.statusDone}>답변 완료</span>
                  <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                </div>
                <h3 style={styles.title}>{item.title}</h3>
                <div style={styles.writerInfo}>{item.author_info ? `${item.author_info.department} ${item.author_info.name}` : `ID: ${item.user_id}`}</div>
              </div>
            ))
          )}
        </div>

      {selectedInquiry && (
        <div style={modalStyles.overlay} onClick={() => setSelectedInquiry(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#2e7d32'}}>문의 상세</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            <div style={modalStyles.content}>
               <div style={modalStyles.section}>
                  <div style={modalStyles.label}>Q. 질문</div>
                  <div style={modalStyles.text}>{selectedInquiry.content}</div>
                  {selectedInquiry.attachment && <a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noreferrer" style={{color:'#2e7d32', display:'block', marginTop:'5px'}}>📎 첨부파일</a>}
               </div>
               <hr style={{margin:'20px 0', border:'0', borderTop:'1px dashed #eee'}}/>
               <div style={modalStyles.section}>
                  <div style={modalStyles.label}>A. 답변</div>
                  {selectedInquiry.replies?.map(r => (
                    <div key={r.id} style={modalStyles.answerBox}>
                        {editingReplyId === r.id ? (
                            <div>
                                <textarea style={modalStyles.editTextarea} value={editContent} onChange={(e)=>setEditContent(e.target.value)}/>
                                <div style={{marginTop:'5px', display:'flex', justifyContent:'flex-end', gap:'5px'}}>
                                    <button onClick={()=>{setEditingReplyId(null)}} style={modalStyles.cancelBtn}>취소</button>
                                    <button onClick={()=>handleUpdateReply(selectedInquiry.id, r.id)} style={modalStyles.saveBtn}>저장</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{whiteSpace:'pre-wrap'}}>{r.content}</div>
                                <button onClick={()=>{setEditingReplyId(r.id); setEditContent(r.content);}} style={{marginTop:'10px', fontSize:'12px', border:'none', background:'none', color:'#003675', cursor:'pointer'}}>✏️ 수정</button>
                            </div>
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
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  listArea: { flex: 1, overflowY: 'auto' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#666' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '5px solid #4caf50' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  statusDone: { color: '#2e7d32', fontWeight: 'bold', fontSize: '12px', backgroundColor:'#e8f5e9', padding:'2px 6px', borderRadius:'4px' },
  date: { color: '#999', fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'5px' },
  writerInfo: { fontSize: '13px', color: '#555', backgroundColor: '#f5f5f5', padding: '5px 8px', borderRadius: '6px', display: 'inline-block' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth: '600px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '15px' },
  label: { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '6px' },
  text: { fontSize: '15px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' },
  answerBox: { backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #c8e6c9' },
  editTextarea: { width: '100%', minHeight: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #a5d6a7', boxSizing: 'border-box' },
  saveBtn: { padding: '6px 12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cancelBtn: { padding: '6px 12px', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default TACompleted;