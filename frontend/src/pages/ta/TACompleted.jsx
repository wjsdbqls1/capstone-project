// src/pages/ta/TACompleted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function TACompleted() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // ★ 수정 모드 상태 관리
  const [editingReplyId, setEditingReplyId] = useState(null); // 현재 수정 중인 답변 ID
  const [editContent, setEditContent] = useState("");         // 수정할 내용
  const [editFile, setEditFile] = useState(null);             // 수정할 파일

  useEffect(() => {
    fetchInquiries();
  }, [navigate]);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    try {
      const response = await axios.get('http://13.219.208.109:8000/inquiries', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 완료된 항목만 필터링
      const completedList = response.data.filter(item => item.status === 'COMPLETED' || item.status === '답변 완료');
      completedList.sort((a, b) => b.id - a.id);
      
      setInquiries(completedList);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  // 상세 정보 불러오기
  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
        const qRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const rRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}/replies`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setSelectedInquiry({
            ...qRes.data,
            replies: rRes.data
        });
        // 상세 열 때마다 수정 모드 초기화
        setEditingReplyId(null);
    } catch (error) {
        alert("상세 정보를 불러오지 못했습니다.");
    }
  };

  // ★ 수정 모드 시작
  const startEditing = (reply) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content);
    setEditFile(null);
  };

  // ★ 수정 취소
  const cancelEditing = () => {
    setEditingReplyId(null);
    setEditContent("");
    setEditFile(null);
  };

  // ★ 수정 저장 요청
  const handleUpdateReply = async (inquiryId, replyId) => {
    if (!editContent.trim()) {
        alert("내용을 입력해주세요.");
        return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("content", editContent);
    if (editFile) {
        formData.append("file", editFile);
    }

    try {
        await axios.put(`http://13.219.208.109:8000/inquiries/${inquiryId}/replies/${replyId}`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data"
            }
        });
        
        alert("답변이 수정되었습니다.");
        handleSelect(inquiryId); // 상세 내용 새로고침 (수정된 내용 반영)
    } catch (error) {
        console.error("수정 실패:", error);
        alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate('/ta/main')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>처리 완료된 문의</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        <div style={styles.listArea}>
          {inquiries.length === 0 ? (
            <div style={styles.emptyMessage}>처리 완료된 문의가 없습니다.</div>
          ) : (
            inquiries.map((item) => (
              <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
                <div style={styles.cardHeader}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={styles.statusDone}>답변 완료</span>
                    <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                  </div>
                </div>
                
                <h3 style={styles.title}>{item.title}</h3>
                
                {/* 작성자 정보 표시 */}
                <div style={styles.writerInfo}>
                    {item.author_info ? (
                        <>
                            <span style={{marginRight:'5px'}}>👤</span>
                            {item.author_info.department} {item.author_info.grade}학년 <strong>{item.author_info.name}</strong> ({item.author_info.student_no})
                        </>
                    ) : (
                        `작성자 ID: ${item.user_id}`
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedInquiry && (
        <div style={modalStyles.overlay} onClick={() => setSelectedInquiry(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#2e7d32'}}>문의 상세 정보</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            
            <div style={modalStyles.content}>
               
               {/* 질문 영역 */}
               <div style={modalStyles.section}>
                  <div style={modalStyles.label}>
                    Q. 질문 내용 
                    {selectedInquiry.author_name && ` (작성자: ${selectedInquiry.author_name})`}
                  </div>
                  
                  {selectedInquiry.author_info && selectedInquiry.author_info.student_no && (
                        <div style={modalStyles.userInfo}>
                            👤 학생 정보: {selectedInquiry.author_info.department} / {selectedInquiry.author_info.grade}학년 / {selectedInquiry.author_info.name} ({selectedInquiry.author_info.student_no})
                        </div>
                  )}

                  <div style={modalStyles.text}>{selectedInquiry.content}</div>
                  
                  {/* 학생 첨부파일 */}
                  {selectedInquiry.attachment && (
                    <div style={modalStyles.fileBox}>
                        📎 <b>학생 첨부파일:</b> 
                        <a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noopener noreferrer" style={modalStyles.fileLink}>
                            보기 / 다운로드
                        </a>
                    </div>
                  )}
               </div>
               
               <hr style={{margin:'20px 0', border:'0', borderTop:'2px dashed #eee'}}/>

               {/* 답변 영역 */}
               <div style={modalStyles.section}>
                  <div style={modalStyles.label}>A. 나의 답변</div>
                  {selectedInquiry.replies && selectedInquiry.replies.length > 0 ? (
                      selectedInquiry.replies.map(r => (
                        <div key={r.id} style={modalStyles.answerBox}>
                            
                            {/* ★ 수정 모드인지 확인 */}
                            {editingReplyId === r.id ? (
                                // 수정 모드일 때
                                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                    <textarea 
                                        style={modalStyles.editTextarea}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                    />
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <input 
                                            type="file" 
                                            style={{fontSize:'13px'}} 
                                            onChange={(e) => setEditFile(e.target.files[0])}
                                        />
                                        <span style={{fontSize:'11px', color:'#888'}}>파일 미선택 시 기존 파일 유지</span>
                                    </div>
                                    <div style={{display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                                        <button onClick={cancelEditing} style={modalStyles.cancelBtn}>취소</button>
                                        <button onClick={() => handleUpdateReply(selectedInquiry.id, r.id)} style={modalStyles.saveBtn}>저장</button>
                                    </div>
                                </div>
                            ) : (
                                // 일반 보기 모드일 때
                                <>
                                    <div style={{whiteSpace:'pre-wrap', lineHeight:'1.5', position:'relative'}}>
                                        {r.content}
                                        {/* ★ 수정된 경우 표시 */}
                                        {r.updated_at && (
                                            <span style={{fontSize:'11px', color:'#999', marginLeft:'8px'}}>(수정됨)</span>
                                        )}
                                        {/* 수정 버튼 */}
                                        <button 
                                            onClick={() => startEditing(r)} 
                                            style={modalStyles.editIconBtn}
                                            title="답변 수정"
                                        >
                                            ✏️ 수정
                                        </button>
                                    </div>

                                    {r.attachment && (
                                        <div style={{marginTop:'10px', fontSize:'13px', borderTop:'1px solid #c8e6c9', paddingTop:'8px'}}>
                                            📎 <a href={`http://13.219.208.109:8000${r.attachment}`} target="_blank" rel="noreferrer" style={{color:'#2e7d32', fontWeight:'bold'}}>답변 첨부파일 확인</a>
                                        </div>
                                    )}
                                    <div style={{fontSize:'11px', color:'#666', marginTop:'8px', textAlign:'right'}}>
                                        작성일: {r.created_at ? r.created_at.split('T')[0] : '날짜없음'}
                                    </div>
                                </>
                            )}
                        </div>
                      ))
                  ) : (
                      <div style={{color:'#999', fontSize:'14px'}}>등록된 답변이 없습니다.</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
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
    backgroundColor: 'rgba(46, 125, 50, 0.9)', 
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
    margin: '15px', 
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

  listArea: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '5px'
  },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#666', fontWeight:'bold' },
  
  card: { 
    backgroundColor: 'white', 
    padding: '15px', 
    borderRadius: '12px', 
    marginBottom: '10px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    cursor: 'pointer', 
    borderLeft: '5px solid #4caf50', 
    transition: 'transform 0.2s'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  statusDone: { color: '#2e7d32', fontWeight: 'bold', fontSize: '12px', backgroundColor:'#e8f5e9', padding:'2px 6px', borderRadius:'4px' },
  date: { color: '#999', fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'5px' },
  
  writerInfo: { 
    fontSize: '13px', 
    color: '#555', 
    marginTop: '8px', 
    backgroundColor: '#f5f5f5', 
    padding: '5px 8px', 
    borderRadius: '6px',
    display: 'inline-block'
  }
};

const modalStyles = {
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 
  },
  modal: { 
    width: '90%', maxWidth: '600px', maxHeight: '85%', 
    backgroundColor: 'white', borderRadius: '12px', 
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: { 
    padding: '15px 20px', borderBottom: '1px solid #eee', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#f9f9f9' 
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '15px' },
  label: { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '6px' },
  text: { fontSize: '15px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' },
  
  userInfo: { fontSize:'13px', color:'#666', marginBottom:'10px', paddingBottom:'8px', borderBottom:'1px dashed #ccc' },
  fileBox: { marginTop:'10px', padding:'8px', backgroundColor:'#f1f8e9', borderRadius:'4px', fontSize:'13px', color:'#33691e', border:'1px solid #c5e1a5' },
  fileLink: { marginLeft:'5px', color:'#2e7d32', fontWeight:'bold', textDecoration:'underline' },
  
  answerBox: { 
    backgroundColor: '#e8f5e9', 
    padding: '15px', 
    borderRadius: '8px', 
    marginBottom: '10px',
    border: '1px solid #c8e6c9',
    position: 'relative'
  },
  editIconBtn: {
    position: 'absolute', top: 0, right: 0,
    background: 'none', border: 'none', 
    fontSize: '12px', color: '#003675', 
    fontWeight: 'bold', cursor: 'pointer',
    padding: '5px'
  },
  editTextarea: {
    width: '100%', minHeight: '80px', padding: '8px',
    borderRadius: '6px', border: '1px solid #a5d6a7',
    fontSize: '14px', boxSizing: 'border-box'
  },
  saveBtn: {
    padding: '6px 12px', backgroundColor: '#2e7d32', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
  },
  cancelBtn: {
    padding: '6px 12px', backgroundColor: '#ccc', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
  }
};

export default TACompleted;