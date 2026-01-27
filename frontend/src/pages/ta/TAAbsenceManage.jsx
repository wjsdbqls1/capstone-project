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
      <div style={styles.glassBox}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <div style={styles.pageTitle}>{view === 'detail' ? '신청서 검토' : '공결 신청 관리'}</div>
            {view === 'detail' && <button onClick={() => setView('list')} style={{cursor:'pointer', border:'none', background:'transparent', fontSize:'14px', color:'#666', fontWeight:'bold'}}>‹ 목록으로</button>}
        </div>
        
        {view === 'list' ? (
            <div style={styles.listArea}>
                {requests.map((req) => {
                    const statusStyle = getStatusStyle(req.status);
                    return (
                        <div key={req.id} style={styles.card} onClick={() => { setSelectedReq(req); setView('detail'); setShowRejectInput(false); }}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                <span style={{fontSize:'12px', color:'#888'}}>{req.created_at.split('T')[0]}</span>
                                <span style={{fontSize:'12px', fontWeight:'bold', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '3px 8px', borderRadius: '6px'}}>{statusStyle.label}</span>
                            </div>
                            <div style={{fontWeight:'bold', fontSize:'16px', color:'#333', marginBottom:'4px'}}>[{req.student_no}] {req.student_name}</div>
                            <div style={{fontSize:'13px', color:'#666'}}>{req.course_name} | {req.absent_date}</div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div style={{overflowY:'auto', padding:'0 10px'}}>
                <div style={styles.section}>
                    <h3 style={{fontSize:'18px', color:'#003675', borderBottom:'2px solid #003675', paddingBottom:'8px', marginBottom:'15px'}}>신청자 정보</h3>
                    <div style={{fontSize:'15px', marginBottom:'5px'}}>학과: {selectedReq.department}</div>
                    <div style={{fontSize:'15px', marginBottom:'5px'}}>학번: {selectedReq.student_no}</div>
                    <div style={{fontSize:'15px'}}>이름: {selectedReq.student_name}</div>
                </div>
                <div style={styles.section}>
                    <h3 style={{fontSize:'18px', color:'#003675', borderBottom:'2px solid #003675', paddingBottom:'8px', marginBottom:'15px'}}>신청 내용</h3>
                    <div style={{marginBottom:'8px'}}><strong>과목:</strong> {selectedReq.course_name}</div>
                    <div style={{marginBottom:'8px'}}><strong>결석일:</strong> <span style={{color:'#c62828'}}>{selectedReq.absent_date}</span></div>
                    <div style={{marginBottom:'15px', backgroundColor:'#f8f9fa', padding:'15px', borderRadius:'8px', border:'1px solid #eee'}}><strong>사유:</strong> {selectedReq.reason}</div>
                    {selectedReq.file && <a href={`http://13.219.208.109:8000/uploads/absence/${selectedReq.file.stored_name}`} target="_blank" rel="noreferrer" style={{color:'#003675', fontWeight:'bold', textDecoration:'underline'}}>📎 증빙서류 보기</a>}
                </div>
                {selectedReq.status === 'SUBMITTED' && (
                    <div style={{marginTop:'30px'}}>
                        {showRejectInput ? (
                            <div style={{padding:'20px', backgroundColor:'#fff', borderRadius:'12px', border:'1px solid #ffcdd2'}}>
                                <textarea style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px', resize:'none', height:'80px', boxSizing:'border-box'}} placeholder="반려 사유 입력" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
                                <div style={{marginTop:'10px', display:'flex', gap:'10px'}}>
                                    <button onClick={()=>setShowRejectInput(false)} style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd', background:'white', cursor:'pointer'}}>취소</button>
                                    <button onClick={()=>handleStatusUpdate('REJECTED')} style={{flex:1, backgroundColor:'#c62828', color:'white', padding:'12px', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>반려 확정</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{display:'flex', gap:'15px'}}>
                                <button onClick={()=>handleStatusUpdate('APPROVED')} style={{flex:1, backgroundColor:'#2e7d32', color:'white', padding:'15px', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 6px rgba(46, 125, 50, 0.2)'}}>승인</button>
                                <button onClick={()=>handleStatusUpdate('REJECTED')} style={{flex:1, backgroundColor:'#c62828', color:'white', padding:'15px', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 6px rgba(198, 40, 40, 0.2)'}}>반려</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </TALayout>
  );
}

const styles = {
  glassBox: { backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '30px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255,255,255,0.8)' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675' },
  listArea: { flex: 1, overflowY: 'auto' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #e9ecef', transition:'transform 0.1s' },
  section: { marginBottom: '20px' }
};

export default TAAbsenceManage;