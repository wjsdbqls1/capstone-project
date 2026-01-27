// src/pages/ta/TAAbsenceManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

function TAAbsenceManage() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [view, setView] = useState('list');
  const [selectedReq, setSelectedReq] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [dateFilter, setDateFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const response = await axios.get('http://13.219.208.109:8000/admin/absence/list', { headers: { Authorization: `Bearer ${token}` } });
      const sortedData = response.data.sort((a, b) => b.id - a.id);
      setRequests(sortedData);
      setFilteredRequests(sortedData);
    } catch (error) { console.error("로딩 실패:", error); }
  };
  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    if (dateFilter === 'all') { setFilteredRequests(requests); return; }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      const reqDateStart = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate());
      if (dateFilter === 'today') return reqDateStart.getTime() === todayStart.getTime();
      if (dateFilter === 'week') {
        const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff)); monday.setHours(0,0,0,0);
        return reqDate >= monday;
      }
      if (dateFilter === 'month') return reqDate.getMonth() === now.getMonth() && reqDate.getFullYear() === now.getFullYear();
      return true;
    });
    setFilteredRequests(result);
  }, [dateFilter, requests]);

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
          {view === 'detail' && (
            <button onClick={() => setView('list')} style={styles.backBtn}>‹ 목록으로</button>
          )}
      </div>
      
      {view === 'list' && (
          <div style={styles.filterBar}>
              <span style={{fontWeight:'bold', color:'#555', marginRight:'10px'}}>📅 기간 선택:</span>
              <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">전체</option><option value="today">오늘</option><option value="week">이번 주</option><option value="month">이번 달</option>
              </select>
          </div>
      )}
      
      {view === 'list' ? (
          <div style={styles.listArea}>
              {filteredRequests.length === 0 ? (
                <div style={{textAlign:'center', marginTop:'50px', color:'#666', fontWeight:'500'}}>{dateFilter !== 'all' ? "선택한 기간에 신청 내역이 없습니다." : "신청 내역이 없습니다."}</div>
              ) : (
                filteredRequests.map((req) => {
                  const statusStyle = getStatusStyle(req.status);
                  return (
                      <div key={req.id} style={styles.card} onClick={() => { setSelectedReq(req); setView('detail'); setShowRejectInput(false); }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
                      >
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                              <span style={{fontSize:'13px', color:'#666', fontWeight:'500'}}>{req.created_at.split('T')[0]}</span>
                              <span style={{fontSize:'12px', fontWeight:'bold', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 8px', borderRadius: '6px'}}>{statusStyle.label}</span>
                          </div>
                          <div style={{fontWeight:'bold', fontSize:'17px', color:'#222', marginBottom:'5px'}}>[{req.student_no}] {req.student_name}</div>
                          <div style={{fontSize:'14px', color:'#555'}}><span style={{fontWeight:'600', color:'#003675'}}>{req.course_name}</span> | <span style={{color:'#c62828'}}>{req.absent_date}</span></div>
                      </div>
                  );
              })
            )}
          </div>
      ) : (
          <div style={styles.detailContainer}>
              <div style={styles.sectionBox}>
                  <h3 style={styles.sectionTitle}>👤 신청자 정보</h3>
                  <div style={styles.infoRow}><span style={styles.label}>학과</span> <span>{selectedReq.department}</span></div>
                  <div style={styles.infoRow}><span style={styles.label}>학번</span> <span>{selectedReq.student_no}</span></div>
                  <div style={styles.infoRow}><span style={styles.label}>이름</span> <span style={{fontWeight:'bold'}}>{selectedReq.student_name}</span></div>
              </div>

              <div style={styles.sectionBox}>
                  <h3 style={styles.sectionTitle}>📄 신청 내용</h3>
                  <div style={styles.infoRow}><span style={styles.label}>과목명</span> <strong>{selectedReq.course_name}</strong></div>
                  <div style={styles.infoRow}><span style={styles.label}>결석일</span> <span style={{color:'#c62828', fontWeight:'bold'}}>{selectedReq.absent_date}</span></div>
                  <div style={{marginTop:'15px'}}><div style={styles.label}>결석 사유</div><div style={styles.reasonBox}>{selectedReq.reason}</div></div>
                  {selectedReq.file && (<div style={{marginTop:'15px'}}><a href={`http://13.219.208.109:8000/uploads/absence/${selectedReq.file.stored_name}`} target="_blank" rel="noreferrer" style={styles.fileLink}>📎 증빙서류 다운로드 / 보기</a></div>)}
              </div>

              {selectedReq.status === 'SUBMITTED' ? (
                  <div style={styles.actionArea}>
                      {showRejectInput ? (
                          <div style={styles.rejectBox}>
                              <div style={{fontWeight:'bold', marginBottom:'8px', color:'#c62828'}}>반려 사유 입력</div>
                              <textarea style={styles.textarea} placeholder="반려 사유 입력" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
                              <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                  <button onClick={()=>setShowRejectInput(false)} style={styles.cancelBtn}>취소</button>
                                  <button onClick={()=>handleStatusUpdate('REJECTED')} style={styles.confirmRejectBtn}>반려 확정</button>
                              </div>
                          </div>
                      ) : (
                          <div style={{display:'flex', gap:'15px'}}>
                              <button onClick={()=>handleStatusUpdate('APPROVED')} style={styles.approveBtn}>승인</button>
                              <button onClick={()=>setShowRejectInput(true)} style={styles.rejectBtn}>반려</button>
                          </div>
                      )}
                  </div>
              ) : (
                <div style={{marginTop:'30px', padding:'15px', borderRadius:'10px', textAlign:'center', fontWeight:'bold', backgroundColor: selectedReq.status === 'APPROVED' ? '#e8f5e9' : '#ffebee', color: selectedReq.status === 'APPROVED' ? '#2e7d32' : '#c62828', border: selectedReq.status === 'APPROVED' ? '1px solid #c8e6c9' : '1px solid #ffcdd2'}}>
                    {selectedReq.status === 'APPROVED' ? "✅ 승인 처리되었습니다." : `🛑 반려되었습니다. (사유: ${selectedReq.reject_reason || '-'})`}
                </div>
              )}
          </div>
      )}
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675' },
  backBtn: { cursor:'pointer', border:'1px solid #ccc', backgroundColor:'white', padding:'6px 12px', borderRadius:'20px', fontSize:'13px', color:'#555', fontWeight:'bold', transition:'all 0.2s' },
  filterBar: { marginBottom:'15px', padding:'10px 15px', backgroundColor:'rgba(255, 255, 255, 0.4)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.6)', display:'flex', alignItems:'center' },
  select: { padding:'8px 12px', borderRadius:'8px', border:'1px solid #ced4da', backgroundColor:'rgba(255,255,255,0.8)', fontSize:'14px', cursor:'pointer', outline:'none', minWidth:'100px' },
  listArea: { flex: 1, overflowY: 'auto', padding: '5px' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '20px', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.8)', borderLeft: '6px solid #003675', transition: 'all 0.2s ease' },
  detailContainer: { overflowY:'auto', padding:'5px' },
  sectionBox: { backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '25px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
  sectionTitle: { fontSize: '18px', color: '#003675', borderBottom: '2px solid #003675', paddingBottom: '10px', marginBottom: '20px', fontWeight:'800' },
  infoRow: { display:'flex', justifyContent:'space-between', marginBottom:'12px', borderBottom:'1px dashed #f0f0f0', paddingBottom:'8px', fontSize:'15px', color:'#333' },
  label: { color:'#666', fontWeight:'bold', minWidth:'80px' },
  reasonBox: { backgroundColor:'#f8f9fa', padding:'15px', borderRadius:'10px', border:'1px solid #eee', color:'#333', lineHeight:'1.6', minHeight:'60px' },
  fileLink: { display:'inline-block', padding:'10px 15px', backgroundColor:'#e3f2fd', color:'#003675', borderRadius:'8px', textDecoration:'none', fontWeight:'bold', border:'1px solid #bbdefb', fontSize:'14px' },
  actionArea: { marginTop: '30px' },
  approveBtn: { flex: 1, backgroundColor: '#2e7d32', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(46, 125, 50, 0.2)', transition: 'background 0.2s' },
  rejectBtn: { flex: 1, backgroundColor: '#c62828', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(198, 40, 40, 0.2)', transition: 'background 0.2s' },
  rejectBox: { padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ffcdd2', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  textarea: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', resize: 'none', height: '100px', boxSizing: 'border-box', fontSize:'15px', fontFamily:'inherit' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight:'bold', color:'#555' },
  confirmRejectBtn: { flex: 1, backgroundColor: '#c62828', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default TAAbsenceManage;