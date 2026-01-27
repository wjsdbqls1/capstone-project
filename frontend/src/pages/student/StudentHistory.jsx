// src/pages/student/StudentHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentHistory() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null); 
  const [detailData, setDetailData] = useState(null); 

  useEffect(() => {
    const fetchInquiries = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://13.219.208.109:8000/inquiries/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInquiries(response.data);
      } catch (error) {
        console.error("목록 로딩 실패:", error);
        if (error.response && error.response.status === 401) {
          localStorage.clear();
          navigate('/');
        }
      }
    };
    fetchInquiries();
  }, [navigate]);

  const handleClickItem = async (item) => {
    setSelectedInquiry(item);
    setDetailData(null); 
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        navigate('/');
        return;
    }

    try {
      const qRes = await axios.get(`http://13.219.208.109:8000/inquiries/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rRes = await axios.get(`http://13.219.208.109:8000/inquiries/${item.id}/replies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDetailData({
        ...qRes.data,
        replies: rRes.data
      });
    } catch (error) {
      console.error("상세 정보 로딩 실패:", error);
      alert("상세 내용을 불러오지 못했습니다.");
    }
  };

  const getStatusBadge = (status) => {
    const isDone = status === 'COMPLETED' || status === '답변 완료';
    return isDone ? styles.statusDone : styles.statusWaiting;
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate('/student/main')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>문의 내역</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 목록 유리 박스 */}
      <div style={styles.glassContainer}>
        {inquiries.length === 0 ? (
          <div style={styles.emptyMessage}>
             아직 작성한 문의가 없습니다. <br/>
             새로운 문의를 등록해보세요!
          </div>
        ) : (
          inquiries.map((item) => (
            <div 
              key={item.id} 
              style={styles.card} 
              onClick={() => handleClickItem(item)}
            >
              <div style={styles.cardHeader}>
                <span style={getStatusBadge(item.status)}>
                  {item.status === 'COMPLETED' ? '답변 완료' : '답변 대기중'}
                </span>
                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
              </div>
              <h3 style={styles.title}>{item.title}</h3>
            </div>
          ))
        )}
      </div>

      {/* 상세 보기 팝업 (모달) */}
      {selectedInquiry && (
        <div style={modalStyles.overlay} onClick={() => setSelectedInquiry(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 헤더 */}
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675', fontSize:'18px'}}>문의 상세</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            
            {/* 모달 내용 */}
            <div style={modalStyles.content}>
              {detailData ? (
                <>
                  <div style={modalStyles.section}>
                    <div style={modalStyles.label}>제목</div>
                    <div style={modalStyles.text}>{detailData.title}</div>
                  </div>
                  
                  {detailData.academic_event && (
                      <div style={modalStyles.section}>
                        <div style={modalStyles.label}>📅 관련 학사일정</div>
                        <div style={{...modalStyles.text, color:'#e65100'}}>
                            {detailData.academic_event.title} <br/>
                            <span style={{fontSize:'14px', fontWeight:'normal'}}>
                              (~{detailData.academic_event.end_date})
                            </span>
                        </div>
                      </div>
                  )}

                  <div style={modalStyles.section}>
                    <div style={modalStyles.label}>내용</div>
                    <div style={modalStyles.textBox}>{detailData.content}</div>
                  </div>
                  
                  {detailData.attachment && (
                    <div style={modalStyles.section}>
                        <div style={modalStyles.label}>📎 내 첨부파일</div>
                        <a href={`http://13.219.208.109:8000${detailData.attachment}`} target="_blank" rel="noopener noreferrer" style={modalStyles.link}>
                            💾 다운로드 / 보기
                        </a>
                    </div>
                  )}
                  
                  <div style={modalStyles.divider}></div>
                  
                  <div style={modalStyles.section}>
                    <div style={modalStyles.label}>🎓 조교 답변</div>
                    {detailData.replies && detailData.replies.length > 0 ? (
                      detailData.replies.map(reply => (
                        <div key={reply.id} style={modalStyles.answerBox}>
                          <div style={{whiteSpace:'pre-wrap'}}>
                              {reply.content}
                              {/* 수정된 답변인 경우 표시 */}
                              {reply.updated_at && <span style={{fontSize:'11px', color:'#999', marginLeft:'5px'}}>(수정됨)</span>}
                          </div>
                          
                          {reply.attachment && (
                            <div style={{marginTop:'10px', fontSize:'14px', borderTop:'1px dashed #a6cbf3', paddingTop:'5px'}}>
                                📎 <b>첨부파일:</b>
                                <a href={`http://13.219.208.109:8000${reply.attachment}`} target="_blank" rel="noopener noreferrer" style={{marginLeft:'5px', color:'#003675', fontWeight:'bold', textDecoration:'underline'}}>
                                    확인하기
                                </a>
                            </div>
                          )}
                          
                          <div style={modalStyles.answerDate}>{reply.created_at.split('T')[0]}</div>
                        </div>
                      ))
                    ) : (
                      <div style={modalStyles.noAnswer}>
                        아직 답변이 등록되지 않았습니다. <br/>조금만 기다려주세요!
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center', padding:'30px'}}>로딩중...</div>
              )}
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
  
  emptyMessage: { 
    textAlign: 'center', 
    marginTop: '50px', 
    color: '#333', 
    fontWeight:'bold', 
    lineHeight: '1.6',
    fontSize: '16px'
  },
  
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    padding: '20px', 
    borderRadius: '12px', 
    marginBottom: '15px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    cursor: 'pointer', 
    borderLeft: '5px solid #003675',
    transition: 'transform 0.2s'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', alignItems:'center' },
  
  statusWaiting: { 
    color: '#ff9800', fontWeight: 'bold', 
    border: '1px solid #ff9800', padding: '4px 8px', borderRadius: '6px', 
    backgroundColor: '#fff3e0', fontSize: '14px' 
  },
  statusDone: { 
    color: '#4caf50', fontWeight: 'bold', 
    border: '1px solid #4caf50', padding: '4px 8px', borderRadius: '6px', 
    backgroundColor: '#e8f5e9', fontSize: '14px' 
  },
  
  date: { color: '#666', fontSize:'14px' },
  title: { 
      margin: 0, 
      fontSize: 'clamp(16px, 4vw, 18px)', // 반응형 폰트
      fontWeight: 'bold', 
      color: '#333',
      lineHeight: '1.4'
  }
};

const modalStyles = {
  overlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 
  },
  modal: { 
    width: '90%', maxWidth: '500px', maxHeight: '85%', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: '16px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)', 
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.5)'
  },
  header: { 
    padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.1)', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.5)' 
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color:'#666' },
  content: { padding: '20px 25px', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '20px' },
  
  label: { fontSize: '14px', color: '#666', marginBottom: '6px', fontWeight:'bold' },
  text: { fontSize: '16px', fontWeight:'bold', color:'#333', lineHeight: '1.4' },
  
  textBox: { 
    fontSize: '16px', lineHeight:'1.6', whiteSpace:'pre-wrap', color:'#333',
    backgroundColor: 'rgba(0,0,0,0.03)', padding: '15px', borderRadius: '8px',
    wordBreak: 'break-word' // 긴 단어 줄바꿈
  },
  link: { color:'#003675', fontWeight:'bold', textDecoration:'underline', fontSize:'15px' },
  
  divider: { margin:'20px 0', border:'0', borderTop:'2px dashed #ddd' },
  
  answerBox: { 
    backgroundColor:'#e3f2fd', padding:'15px', borderRadius:'10px', 
    color:'#003675', lineHeight:'1.6', marginBottom:'10px',
    border: '1px solid #bbdefb',
    fontSize: '16px'
  },
  answerDate: { fontSize:'13px', color:'#5472d3', marginTop:'8px', textAlign:'right' },
  noAnswer: { 
    color:'#888', padding:'20px', backgroundColor:'#f5f5f5', 
    borderRadius:'10px', textAlign:'center', fontSize:'16px', lineHeight:'1.5'
  }
};

export default StudentHistory;