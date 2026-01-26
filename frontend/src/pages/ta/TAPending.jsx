// src/pages/ta/TAPending.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function TAPending() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({}); 
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // 답변 입력 상태
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState(null); 

  const [sortType, setSortType] = useState('latest'); 

  // 1. 데이터 가져오기
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    try {
      const resInq = await axios.get('http://localhost:8000/inquiries', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pendingList = resInq.data.filter(item => 
        item.status !== 'COMPLETED' && item.status !== '답변 완료'
      );
      
      const resEvents = await axios.get('http://localhost:8000/academic-events');
      const eventMap = {};
      resEvents.data.forEach(ev => {
        eventMap[ev.id] = ev;
      });
      setAcademicEvents(eventMap);

      setInquiries(sortList(pendingList, 'latest', eventMap));

    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      if (error.response && error.response.status === 401) {
        alert("세션이 만료되었습니다.");
        localStorage.clear();
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 정렬 로직
  const sortList = (list, type, eventMap) => {
    const sorted = [...list];
    if (type === 'latest') {
      sorted.sort((a, b) => b.id - a.id);
    } else if (type === 'old') {
      sorted.sort((a, b) => a.id - b.id);
    } else if (type === 'deadline') {
      sorted.sort((a, b) => {
        const dateA = a.academic_event_id && eventMap[a.academic_event_id] 
                      ? eventMap[a.academic_event_id].end_date 
                      : '9999-12-31';
        const dateB = b.academic_event_id && eventMap[b.academic_event_id] 
                      ? eventMap[b.academic_event_id].end_date 
                      : '9999-12-31';
        
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

  // 3. 문의 상세 조회
  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8000/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedInquiry(response.data);
      setReplyContent("");
      setReplyFile(null); 
    } catch (error) {
      console.error("상세 로딩 실패:", error);
      alert("상세 내용을 가져오지 못했습니다.");
    }
  };

  // 4. 답변 등록
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('content', replyContent);
    if (replyFile) {
        formData.append('file', replyFile);
    }

    try {
      await axios.post(`http://localhost:8000/inquiries/${selectedInquiry.id}/replies`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
        }
      });
      
      alert("답변이 등록되었습니다!");
      setSelectedInquiry(null);
      fetchData(); 
    } catch (error) {
      console.error("답변 등록 실패:", error);
      alert("오류가 발생했습니다.");
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

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>대기중인 문의</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {/* 정렬 버튼 영역 */}
        <div style={styles.sortBar}>
            <button 
                onClick={() => handleSortChange('deadline')}
                style={sortType === 'deadline' ? styles.activeSortBtn : styles.sortBtn}
            >
                📅 학사일정 마감순
            </button>
            <button 
                onClick={() => handleSortChange('latest')}
                style={sortType === 'latest' ? styles.activeSortBtn : styles.sortBtn}
            >
                ⬇ 최신순
            </button>
            <button 
                onClick={() => handleSortChange('old')}
                style={sortType === 'old' ? styles.activeSortBtn : styles.sortBtn}
            >
                ⬆ 오래된순
            </button>
        </div>

        {/* 목록 영역 */}
        <div style={styles.listArea}>
            {inquiries.length === 0 ? (
                <div style={styles.emptyMessage}>대기 중인 문의가 없습니다. 🎉</div>
            ) : (
                inquiries.map((item) => {
                    const eventInfo = item.academic_event_id ? academicEvents[item.academic_event_id] : null;
                    
                    return (
                        <div 
                            key={item.id} 
                            style={styles.card} 
                            onClick={() => handleSelect(item.id)}
                        >
                            <div style={styles.cardHeader}>
                                <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                                    <span style={styles.statusBadge}>답변 대기</span>
                                    {eventInfo && (
                                        <span style={styles.eventBadge}>
                                            D-day: {eventInfo.end_date}
                                        </span>
                                    )}
                                </div>
                                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                            </div>
                            
                            <div style={styles.title}>{item.title}</div>
                            
                            {eventInfo && (
                                <div style={styles.relatedEvent}>
                                    📌 관련 일정: {eventInfo.title}
                                </div>
                            )}
                            
                            {/* ★ 수정된 부분: 작성자 정보 상세 표시 */}
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
                    );
                })
            )}
        </div>

      </div>

      {/* 답변 작성 모달 */}
      {selectedInquiry && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675'}}>답변 작성하기</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            
            <div style={modalStyles.content}>
              {/* 질문 내용 표시 */}
              <div style={modalStyles.questionBox}>
                <div style={modalStyles.label}>
                    Q. 질문 내용 
                    {selectedInquiry.author_name && ` (작성자: ${selectedInquiry.author_name})`}
                </div>
                
                {selectedInquiry.author_info && selectedInquiry.author_info.student_no && (
                    <div style={modalStyles.userInfo}>
                        👤 학생 정보: {selectedInquiry.author_info.department} / {selectedInquiry.author_info.grade}학년 / {selectedInquiry.author_info.name} ({selectedInquiry.author_info.student_no})
                    </div>
                )}

                <div style={modalStyles.qTitle}>{selectedInquiry.title}</div>
                <div style={modalStyles.qText}>{selectedInquiry.content}</div>
                
                {/* 학생 첨부파일 */}
                {selectedInquiry.attachment && (
                    <div style={modalStyles.fileBox}>
                        📎 <b>학생 첨부파일:</b> 
                        <a href={`http://localhost:8000${selectedInquiry.attachment}`} target="_blank" rel="noopener noreferrer" style={modalStyles.fileLink}>
                            다운로드 / 보기
                        </a>
                    </div>
                )}

                {selectedInquiry.academic_event && (
                    <div style={modalStyles.eventTag}>
                      📅 관련 일정: {selectedInquiry.academic_event.title} (~{selectedInquiry.academic_event.end_date})
                    </div>
                )}
              </div>

              {/* 답변 입력 */}
              <div style={modalStyles.answerArea}>
                <div style={modalStyles.label}>A. 답변 입력</div>
                <textarea 
                  style={modalStyles.textarea}
                  placeholder="답변을 입력하세요."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                
                <div style={{marginTop:'10px'}}>
                    <div style={modalStyles.label}>📎 답변 첨부파일 (선택)</div>
                    <input 
                        type="file" 
                        onChange={(e) => setReplyFile(e.target.files[0])}
                        style={{marginTop:'5px', fontSize:'14px'}}
                    />
                </div>
              </div>

              <button style={modalStyles.submitBtn} onClick={handleSubmitReply}>
                답변 등록
              </button>
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

  sortBar: {
      display: 'flex',
      gap: '8px',
      marginBottom: '15px',
      flexWrap: 'wrap'
  },
  sortBtn: { 
      padding: '8px 12px', 
      border: '1px solid #ddd', 
      borderRadius: '20px', 
      background: 'white', 
      cursor: 'pointer', 
      fontSize: '13px',
      color: '#555'
  },
  activeSortBtn: { 
      padding: '8px 12px', 
      border: '1px solid #003675', 
      borderRadius: '20px', 
      background: '#003675', 
      color: 'white', 
      cursor: 'pointer', 
      fontSize: '13px', 
      fontWeight: 'bold' 
  },

  listArea: {
      flex: 1,
      overflowY: 'auto',
      paddingRight: '5px'
  },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },

  card: { 
      backgroundColor: 'white', 
      padding: '15px', 
      borderRadius: '12px', 
      marginBottom: '10px', 
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
      cursor: 'pointer', 
      borderLeft: '5px solid #ff9800',
      transition: 'transform 0.2s'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems:'flex-start' },
  statusBadge: { color: '#ff9800', fontWeight: 'bold', fontSize: '13px', backgroundColor:'#fff3e0', padding:'2px 6px', borderRadius:'4px' },
  eventBadge: { backgroundColor: '#ffe0b2', color: '#e65100', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', fontWeight:'bold' },
  date: { color: '#999', fontSize: '12px', marginLeft:'5px' },
  title: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'5px' },
  relatedEvent: { fontSize: '13px', color: '#e65100', marginTop: '4px', fontWeight:'500' },
  
  // ★ 수정된 스타일
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
      width: '90%', maxWidth:'600px', maxHeight: '85%', 
      backgroundColor: 'white', borderRadius: '12px', 
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: { 
      padding: '15px 20px', borderBottom: '1px solid #eee', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      backgroundColor: '#f9f9f9' 
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color:'#666' },
  content: { padding: '20px', overflowY: 'auto', flex: 1 },
  label: { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '6px' },
  questionBox: { marginBottom: '20px', padding: '15px', backgroundColor: '#fff8e1', borderRadius: '8px', border:'1px solid #ffe0b2' },
  userInfo: { fontSize:'13px', color:'#666', marginBottom:'10px', paddingBottom:'8px', borderBottom:'1px dashed #ccc' },
  qTitle: { fontWeight: 'bold', marginBottom: '8px', fontSize: '16px', color:'#333' },
  qText: { fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color:'#444' },
  fileBox: { marginTop:'15px', padding:'10px', backgroundColor:'#fff', border:'1px solid #ddd', borderRadius:'4px', fontSize:'13px' },
  fileLink: { marginLeft:'8px', color:'#003675', fontWeight:'bold', textDecoration:'underline' },
  eventTag: { marginTop: '10px', fontSize: '13px', color: '#ef6c00', fontWeight: 'bold' },
  answerArea: { marginBottom: '20px' },
  textarea: { 
      width: '100%', minHeight: '150px', padding: '12px', 
      border: '1px solid #ccc', borderRadius: '8px', 
      fontSize: '15px', resize: 'none', boxSizing: 'border-box',
      outline: 'none', backgroundColor:'#fdfdfd'
  },
  submitBtn: { 
      width: '100%', padding: '15px', backgroundColor: '#003675', 
      color: 'white', border: 'none', borderRadius: '8px', 
      fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};

export default TAPending;