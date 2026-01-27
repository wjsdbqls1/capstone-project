// src/pages/ta/TAAbsenceManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css'; 

function TAAbsenceManage() {
  const navigate = useNavigate();
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

  const handleItemClick = (req) => { setSelectedReq(req); setView('detail'); setShowRejectInput(false); setRejectReason(''); };
  const handleBackToList = () => { setView('list'); setSelectedReq(null); };

  const handleStatusUpdate = async (status) => {
    if (!selectedReq) return;
    if (status === 'REJECTED' && !showRejectInput) { setShowRejectInput(true); return; }
    if (status === 'REJECTED' && !rejectReason.trim()) { alert("반려 사유를 입력해주세요."); return; }
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://13.219.208.109:8000/admin/absence/${selectedReq.id}/status`, 
        { status: status, reject_reason: status === 'REJECTED' ? rejectReason : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(status === 'APPROVED' ? "✅ 승인되었습니다." : "🛑 반려되었습니다.");
      await fetchRequests();
      setView('list'); setSelectedReq(null);
    } catch (error) { alert("처리에 실패했습니다."); }
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
        {view === 'detail' && (
            <button onClick={handleBackToList} style={styles.backLink}>‹ 목록으로 돌아가기</button>
        )}
        <div style={styles.pageTitle}>{view === 'detail' ? '신청서 검토' : '공결 신청 관리'}</div>
        
        {view === 'list' ? (
            <div style={styles.listArea}>
                {requests.length === 0 ? <div style={styles.emptyMessage}>신청 내역이 없습니다.</div> : requests.map((req) => {
                    const statusStyle = getStatusStyle(req.status);
                    return (
                        <div key={req.id} style={styles.card} onClick={() => handleItemClick(req)}>
                            <div style={styles.cardHeader}>
                                <span style={{fontSize:'12px', color:'#888'}}>{req.created_at ? req.created_at.split('T')[0] : '날짜없음'}</span>
                                <span style={{fontSize:'12px', fontWeight:'bold', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '3px 8px', borderRadius: '10px'}}>{statusStyle.label}</span>
                            </div>
                            <div style={styles.cardTitle}>[{req.student_no}] {req.student_name}</div>
                            <div style={styles.cardSub}>{req.course_name} <span style={{margin:'0 5px', color:'#ddd'}}>|</span> {req.absent_date}</div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div style={styles.detailArea}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>👤 신청자 정보</h3>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}><span style={styles.label}>학과</span><span style={styles.value}>{selectedReq.department || '-'}</span></div>
                        <div style={styles.infoItem}><span style={styles.label}>학번</span><span style={styles.value}>{selectedReq.student_no}</span></div>
                        <div style={styles.infoItem}><span style={styles.label}>이름</span><span style={styles.value}>{selectedReq.student_name}</span></div>
                        <div style={styles.infoItem}><span style={styles.label}>학년</span><span style={styles.value}>{selectedReq.grade}학년</span></div>
                    </div>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📄 신청 내용</h3>
                    <div style={styles.infoRow}><span style={styles.label}>결석일</span><span style={{...styles.value, color:'#d32f2f'}}>{selectedReq.absent_date}</span></div>
                    <div style={styles.infoRow}><span style={styles.label}>과목명</span><span style={styles.value}>{selectedReq.course_name}</span></div>
                    <div style={{marginTop:'15px'}}><span style={styles.label}>사유</span><div style={styles.reasonBox}>{selectedReq.reason}</div></div>
                    <div style={{marginTop:'15px'}}>
                        <span style={styles.label}>증빙서류 </span>
                        {selectedReq.file ? (
                            <a href={`http://13.219.208.109:8000/uploads/absence/${selectedReq.file.stored_name}`} download={selectedReq.file.original_name} target="_blank" rel="noopener noreferrer" style={styles.fileButton}>📎 {selectedReq.file.original_name}</a>
                        ) : <span style={{fontSize:'13px', color:'#999'}}>없음</span>}
                    </div>
                </div>
                <div style={styles.actionArea}>
                    {selectedReq.status === 'SUBMITTED' ? (
                        showRejectInput ? (
                            <div style={styles.rejectInputBox}>
                                <textarea style={styles.textarea} placeholder="반려 사유 입력" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}/>
                                <div style={styles.btnGroup}>
                                    <button style={styles.cancelBtn} onClick={() => setShowRejectInput(false)}>취소</button>
                                    <button style={styles.confirmRejectBtn} onClick={() => handleStatusUpdate('REJECTED')}>반려 확정</button>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.btnGroup}>
                                <button style={styles.rejectBtn} onClick={() => handleStatusUpdate('REJECTED')}>반려</button>
                                <button style={styles.approveBtn} onClick={() => handleStatusUpdate('APPROVED')}>승인</button>
                            </div>
                        )
                    ) : (
                        <div style={{textAlign:'center', padding:'15px', borderRadius:'10px', marginTop:'20px', backgroundColor: selectedReq.status === 'APPROVED' ? '#e8f5e9' : '#ffebee', color: selectedReq.status === 'APPROVED' ? '#2e7d32' : '#c62828', fontWeight: 'bold', border: selectedReq.status === 'APPROVED' ? '1px solid #c8e6c9' : '1px solid #ffcdd2'}}>
                            {selectedReq.status === 'APPROVED' ? "✅ 승인 처리됨" : `🛑 반려됨 (사유: ${selectedReq.reject_reason || '-'})`}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </TALayout>
  );
}

const styles = {
  glassBox: { backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', borderRadius: '20px', padding: '30px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  backLink: { background:'none', border:'none', color:'#666', cursor:'pointer', marginBottom:'10px', fontSize:'14px', textAlign:'left', padding:0 },
  listArea: { flex: 1, overflowY: 'auto', paddingRight:'5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems:'center' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'4px' },
  cardSub: { fontSize: '13px', color: '#666' },
  detailArea: { flex: 1, overflowY: 'auto', paddingRight:'5px' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#003675', marginBottom: '10px', borderLeft: '4px solid #003675', paddingLeft: '8px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  infoItem: { display: 'flex', flexDirection: 'column' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px', borderBottom:'1px dashed #eee', paddingBottom:'8px' },
  label: { fontSize: '14px', color: '#888', fontWeight: 'bold', marginBottom:'4px' },
  value: { fontSize: '15px', color: '#333', fontWeight: '500' },
  divider: { height: '1px', backgroundColor: '#ddd', margin: '15px 0' },
  reasonBox: { backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5', minHeight: '60px', border: '1px solid #eee', color: '#444' },
  fileButton: { display: 'inline-flex', alignItems: 'center', padding: '8px 12px', backgroundColor: '#e3f2fd', color: '#003675', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' },
  actionArea: { marginTop: '20px', paddingBottom: '20px' },
  btnGroup: { display: 'flex', gap: '10px' },
  approveBtn: { flex: 1, padding: '15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  rejectBtn: { flex: 1, padding: '15px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  rejectInputBox: { backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '1px solid #ffcdd2' },
  textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', resize: 'none', boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '10px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  confirmRejectBtn: { flex: 1, padding: '10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TAAbsenceManage;