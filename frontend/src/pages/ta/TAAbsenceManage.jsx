// src/pages/ta/TAAbsenceManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function TAAbsenceManage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  
  // 화면 상태: 'list' | 'detail'
  const [view, setView] = useState('list');
  const [selectedReq, setSelectedReq] = useState(null);

  // 반려 사유 입력 상태
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 1. 공결 목록 불러오기
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const response = await axios.get('http://13.219.208.109:8000/admin/absence/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 최신순 정렬
      const sortedList = response.data.sort((a, b) => b.id - a.id);
      setRequests(sortedList);
    } catch (error) {
      console.error("공결 목록 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 목록에서 항목 클릭
  const handleItemClick = (req) => {
    setSelectedReq(req);
    setView('detail');
    setShowRejectInput(false);
    setRejectReason('');
  };

  // 뒤로가기 버튼 로직 (상세 -> 목록 -> 메인)
  const handleBack = () => {
    if (view === 'detail') {
        setView('list');
        setSelectedReq(null);
    } else {
        navigate('/ta/main');
    }
  };

  // 승인/반려 처리
  const handleStatusUpdate = async (status) => {
    if (!selectedReq) return;

    if (status === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (status === 'REJECTED' && !rejectReason.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://13.219.208.109:8000/admin/absence/${selectedReq.id}/status`, 
        { 
          status: status,
          reject_reason: status === 'REJECTED' ? rejectReason : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(status === 'APPROVED' ? "✅ 승인되었습니다." : "🛑 반려되었습니다.");
      
      await fetchRequests();
      setView('list');
      setSelectedReq(null);

    } catch (error) {
      console.error("상태 업데이트 실패:", error);
      alert("처리에 실패했습니다.");
    }
  };

  // 상태에 따른 뱃지 스타일
  const getStatusStyle = (status) => {
    switch (status) {
        case 'APPROVED': return { bg: '#e8f5e9', text: '#2e7d32', label: '승인' };
        case 'REJECTED': return { bg: '#ffebee', text: '#c62828', label: '반려' };
        default: return { bg: '#fff3e0', text: '#ef6c00', label: '검토대기' };
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={handleBack}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> {view === 'detail' ? '목록' : '뒤로가기'}
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>
            {view === 'detail' ? '신청서 검토' : '공결 신청 관리'}
        </h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {view === 'list' ? (
            /* [목록 화면] */
            <div style={styles.listArea}>
                {requests.length === 0 ? (
                    <div style={styles.emptyMessage}>신청 내역이 없습니다.</div>
                ) : (
                    requests.map((req) => {
                        const statusStyle = getStatusStyle(req.status);
                        return (
                            <div key={req.id} style={styles.card} onClick={() => handleItemClick(req)}>
                                <div style={styles.cardHeader}>
                                    <span style={{fontSize:'12px', color:'#888'}}>{req.created_at ? req.created_at.split('T')[0] : '날짜없음'}</span>
                                    <span style={{
                                        fontSize:'12px', fontWeight:'bold', 
                                        backgroundColor: statusStyle.bg, color: statusStyle.text,
                                        padding: '3px 8px', borderRadius: '10px'
                                    }}>
                                        {statusStyle.label}
                                    </span>
                                </div>
                                <div style={styles.cardTitle}>
                                    [{req.student_no}] {req.student_name}
                                </div>
                                <div style={styles.cardSub}>
                                    {req.course_name} <span style={{margin:'0 5px', color:'#ddd'}}>|</span> {req.absent_date}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        ) : (
            /* [상세 화면] */
            <div style={styles.detailArea}>
                {/* 1. 신청자 정보 */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>👤 신청자 정보</h3>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>학과</span>
                            <span style={styles.value}>{selectedReq.department || '-'}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>학번</span>
                            <span style={styles.value}>{selectedReq.student_no}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>이름</span>
                            <span style={styles.value}>{selectedReq.student_name}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.label}>학년</span>
                            <span style={styles.value}>{selectedReq.grade}학년</span>
                        </div>
                    </div>
                </div>

                <div style={styles.divider}></div>

                {/* 2. 신청 내용 */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📄 신청 내용</h3>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>결석일</span>
                        <span style={{...styles.value, color:'#d32f2f'}}>{selectedReq.absent_date}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.label}>과목명</span>
                        <span style={styles.value}>{selectedReq.course_name}</span>
                    </div>
                    
                    <div style={{marginTop:'15px'}}>
                        <span style={styles.label}>사유</span>
                        <div style={styles.reasonBox}>{selectedReq.reason}</div>
                    </div>

                    <div style={{marginTop:'15px'}}>
                        <span style={styles.label}>증빙서류  </span>
                        {selectedReq.file ? (
                            <a 
                                href={`http://13.219.208.109:8000/uploads/absence/${selectedReq.file.stored_name}`} 
                                download={selectedReq.file.original_name}
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={styles.fileButton}
                            >
                                📎 {selectedReq.file.original_name} (다운로드)
                            </a>
                        ) : (
                            <div style={{fontSize:'13px', color:'#999', marginTop:'5px'}}>첨부파일 없음</div>
                        )}
                    </div>
                </div>

                {/* 3. 승인/반려 액션 영역 */}
                <div style={styles.actionArea}>
                    {selectedReq.status === 'SUBMITTED' ? (
                        <>
                            {showRejectInput ? (
                                <div style={styles.rejectInputBox}>
                                    <textarea 
                                        style={styles.textarea}
                                        placeholder="반려 사유를 입력하세요 (학생에게 전달됨)"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
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
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign:'center', padding:'15px', borderRadius:'10px', marginTop:'20px',
                            backgroundColor: selectedReq.status === 'APPROVED' ? '#e8f5e9' : '#ffebee',
                            color: selectedReq.status === 'APPROVED' ? '#2e7d32' : '#c62828',
                            fontWeight: 'bold', border: selectedReq.status === 'APPROVED' ? '1px solid #c8e6c9' : '1px solid #ffcdd2'
                        }}>
                            {selectedReq.status === 'APPROVED' ? "✅ 승인 처리된 내역입니다." : `🛑 반려된 내역입니다. (사유: ${selectedReq.reject_reason || '-'})`}
                        </div>
                    )}
                </div>

            </div>
        )}
      </div>
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
    margin: '15px', // 여백 축소
    // clamp(최소, 권장, 최대) -> 화면 크기에 따라 패딩 자동 조절
    padding: 'clamp(15px, 3vw, 40px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  // 목록 스타일
  listArea: { flex: 1, overflowY: 'auto', paddingRight:'5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },
  card: { 
    backgroundColor: 'white', 
    padding: '15px', 
    borderRadius: '12px', 
    marginBottom: '10px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems:'center' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'4px' },
  cardSub: { fontSize: '13px', color: '#666' },

  // 상세 화면 스타일
  detailArea: { flex: 1, overflowY: 'auto', paddingRight:'5px' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#003675', marginBottom: '10px', borderLeft: '4px solid #003675', paddingLeft: '8px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  infoItem: { display: 'flex', flexDirection: 'column' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px', borderBottom:'1px dashed #eee', paddingBottom:'8px' },
  
  label: { fontSize: '15px', color: '#888', fontWeight: 'bold', marginBottom:'4px' },
  value: { fontSize: '15px', color: '#333', fontWeight: '500' },
  divider: { height: '1px', backgroundColor: '#ddd', margin: '15px 0' },
  
  reasonBox: { 
    backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', 
    fontSize: '14px', lineHeight: '1.5', minHeight: '60px', 
    border: '1px solid #eee', color: '#444'
  },
  
  fileButton: {
    display: 'inline-flex', alignItems: 'center', 
    padding: '10px 15px', backgroundColor: '#e3f2fd', 
    color: '#003675', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
    fontSize: '13px', marginTop: '5px', border: '1px solid #bbdefb'
  },

  // 버튼 영역
  actionArea: { marginTop: '20px', paddingBottom: '20px' },
  btnGroup: { display: 'flex', gap: '10px' },
  approveBtn: { flex: 1, padding: '15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  rejectBtn: { flex: 1, padding: '15px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  
  rejectInputBox: { backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: '1px solid #ffcdd2' },
  textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', resize: 'none', boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '10px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  confirmRejectBtn: { flex: 1, padding: '10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TAAbsenceManage;