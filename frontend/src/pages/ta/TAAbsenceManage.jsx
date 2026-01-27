// src/pages/ta/TAAbsenceManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

function TAAbsenceManage() {
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('list');
  const [selectedReq, setSelectedReq] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const response = await axios.get('http://13.219.208.109:8000/admin/absence/list', { headers: { Authorization: `Bearer ${token}` } });
      setRequests(response.data.sort((a, b) => b.id - a.id));
    } catch (error) { console.error("공결 목록 로딩 실패:", error); }
  };
  useEffect(() => { fetchRequests(); }, []);

  const handleStatusUpdate = async (status) => {
    if (!selectedReq) return;
    if (status === 'REJECTED' && !showRejectInput) { setShowRejectInput(true); return; }
    const token = localStorage.getItem("token");
    await axios.put(`http://13.219.208.109:8000/admin/absence/${selectedReq.id}/status`, { status, reject_reason: rejectReason }, { headers: { Authorization: `Bearer ${token}` } });
    alert("처리 완료"); fetchRequests(); setView('list'); setSelectedReq(null);
  };

  const getStatusStyle = (status) => {
    switch (status) {
        case 'APPROVED': return { bg: '#e8f5e9', text: '#2e7d32', label: '승인' };
        case 'REJECTED': return { bg: '#ffebee', text: '#c62828', label: '반려' };
        default: return { bg: '#fff3e0', text: '#ef6c00', label: '검토대기' };
    }
  };

  return (
    <TALayout>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <div style={styles.pageTitle}>{view === 'detail' ? '신청서 검토' : '공결 신청 관리'}</div>
            {view === 'detail' && <button onClick={() => setView('list')}>목록으로</button>}
        </div>
        
        {view === 'list' ? (
            <div style={styles.listArea}>
                {requests.map((req) => {
                    const statusStyle = getStatusStyle(req.status);
                    return (
                        <div key={req.id} style={styles.card} onClick={() => { setSelectedReq(req); setView('detail'); setShowRejectInput(false); }}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                <span style={{fontSize:'12px', color:'#888'}}>{req.created_at.split('T')[0]}</span>
                                <span style={{fontSize:'12px', fontWeight:'bold', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '2px 8px', borderRadius: '10px'}}>{statusStyle.label}</span>
                            </div>
                            <div style={{fontWeight:'bold'}}>[{req.student_no}] {req.student_name}</div>
                            <div style={{fontSize:'13px', color:'#666'}}>{req.course_name} | {req.absent_date}</div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div style={{overflowY:'auto'}}>
                <div style={styles.section}>
                    <h3>신청자 정보</h3>
                    <div>{selectedReq.department} / {selectedReq.student_no} / {selectedReq.student_name}</div>
                </div>
                <div style={styles.section}>
                    <h3>신청 내용</h3>
                    <div>과목: {selectedReq.course_name}</div>
                    <div>결석일: {selectedReq.absent_date}</div>
                    <div>사유: {selectedReq.reason}</div>
                    {selectedReq.file && <a href={`http://13.219.208.109:8000/uploads/absence/${selectedReq.file.stored_name}`} target="_blank" rel="noreferrer">📎 증빙서류 보기</a>}
                </div>
                {selectedReq.status === 'SUBMITTED' && (
                    <div style={{marginTop:'20px'}}>
                        {showRejectInput ? (
                            <div>
                                <textarea style={{width:'100%', padding:'10px'}} placeholder="반려 사유" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
                                <button onClick={()=>handleStatusUpdate('REJECTED')} style={{backgroundColor:'#c62828', color:'white', padding:'10px'}}>반려 확정</button>
                            </div>
                        ) : (
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={()=>handleStatusUpdate('APPROVED')} style={{flex:1, backgroundColor:'#2e7d32', color:'white', padding:'15px', border:'none'}}>승인</button>
                                <button onClick={()=>handleStatusUpdate('REJECTED')} style={{flex:1, backgroundColor:'#c62828', color:'white', padding:'15px', border:'none'}}>반려</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675' },
  listArea: { flex: 1, overflowY: 'auto' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer' },
  section: { marginBottom: '20px', paddingBottom:'10px', borderBottom:'1px solid #eee' }
};

export default TAAbsenceManage;