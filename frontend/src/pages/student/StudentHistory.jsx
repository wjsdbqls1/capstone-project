// src/pages/student/StudentHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdChevronLeft, MdClose, MdCalendarToday, MdAttachFile, MdDownload, MdSchool, MdLogout, MdHome, MdPerson, MdSend } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';
import { API_BASE } from '../../config';

function StudentHistory() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [followupText, setFollowupText] = useState('');
  const [followupFile, setFollowupFile] = useState(null);
  const [sendingFollowup, setSendingFollowup] = useState(false);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/inquiries/me`, {
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

  useEffect(() => { fetchInquiries(); }, [navigate]);

  const fetchDetail = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        navigate('/');
        return;
    }

    try {
      const qRes = await axios.get(`${API_BASE}/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rRes = await axios.get(`${API_BASE}/inquiries/${id}/replies`, {
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

  const handleClickItem = async (item) => {
    setSelectedInquiry(item);
    setDetailData(null);
    setFollowupText('');
    setFollowupFile(null);
    fetchDetail(item.id);
  };

  const handleSendFollowup = async () => {
    if (!followupText.trim() || !selectedInquiry) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    setSendingFollowup(true);
    const formData = new FormData();
    formData.append('content', followupText);
    if (followupFile) formData.append('file', followupFile);

    try {
      await axios.post(
        `${API_BASE}/inquiries/${selectedInquiry.id}/followup`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setFollowupText('');
      setFollowupFile(null);
      await fetchDetail(selectedInquiry.id);
      fetchInquiries(); // 목록의 상태 배지(대기중/완료)도 갱신
    } catch (error) {
      console.error("추가 질문 등록 실패:", error);
      alert("추가 질문 등록에 실패했습니다.");
    } finally {
      setSendingFollowup(false);
    }
  };

  const getStatusBadge = (status) => {
    const isDone = status === 'COMPLETED' || status === '답변 완료';
    return isDone ? styles.statusDone : styles.statusWaiting;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
           <MdChevronLeft size={20} /> 뒤로가기
        </button>

        <h2 style={styles.headerTitle}>문의 내역</h2>
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
            <motion.div
              key={item.id}
              style={styles.card}
              onClick={() => handleClickItem(item)}
              whileHover={{ y: -3, boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.99 }}
            >
              <div style={styles.cardHeader}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={getStatusBadge(item.status)}>
                    {item.status === 'COMPLETED' ? '답변 완료' : '답변 대기중'}
                  </span>
                  {item.reply_edited && <span style={styles.reAnswer}>재답변</span>}
                </div>
                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
              </div>
              <h3 style={styles.title}>{item.title}</h3>
            </motion.div>
          ))
        )}
      </div>

      {/* 상세 보기 팝업 (모달) */}
      <AnimatedModal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        overlayStyle={modalStyles.overlay}
        modalStyle={modalStyles.modal}
      >
            {/* 모달 헤더 */}
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#003675', fontSize:'18px'}}>문의 상세</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}><MdClose size={20} /></button>
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
                        <div style={{...modalStyles.label, display: 'flex', alignItems: 'center', gap: '5px'}}><MdCalendarToday size={14} /> 관련 학사일정</div>
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
                        <div style={{...modalStyles.label, display: 'flex', alignItems: 'center', gap: '5px'}}><MdAttachFile size={14} /> 내 첨부파일</div>
                        <a href={`${API_BASE}${detailData.attachment}`} target="_blank" rel="noopener noreferrer" style={{...modalStyles.link, display: 'inline-flex', alignItems: 'center', gap: '5px'}}>
                            <MdDownload size={14} /> 다운로드 / 보기
                        </a>
                    </div>
                  )}

                  <div style={modalStyles.divider}></div>

                  <div style={modalStyles.section}>
                    <div style={{...modalStyles.label, display: 'flex', alignItems: 'center', gap: '5px'}}><MdSchool size={14} /> 대화 내역</div>
                    {detailData.replies && detailData.replies.length > 0 ? (
                      detailData.replies.map(reply => {
                        const isStudent = reply.sender_role === 'student';
                        return (
                          <div key={reply.id} style={isStudent ? modalStyles.myMessageBox : modalStyles.answerBox}>
                            <div style={modalStyles.senderLabel}>{isStudent ? '나의 추가 질문' : '조교 답변'}</div>
                            <div style={{whiteSpace:'pre-wrap'}}>
                                {reply.content}
                                {/* 수정된 답변인 경우 표시 */}
                                {reply.updated_at && <span style={{fontSize:'11px', color:'#999', marginLeft:'5px'}}>(수정됨)</span>}
                            </div>

                            {reply.attachment && (
                              <div style={{marginTop:'10px', fontSize:'14px', borderTop:'1px dashed rgba(0,0,0,0.15)', paddingTop:'5px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap'}}>
                                  <MdAttachFile size={13} /> <b>첨부파일:</b>
                                  <a href={`${API_BASE}${reply.attachment}`} target="_blank" rel="noopener noreferrer" style={{color:'#003675', fontWeight:'bold', textDecoration:'underline'}}>
                                      확인하기
                                  </a>
                              </div>
                            )}

                            <div style={modalStyles.answerDate}>{reply.created_at.split('T')[0]}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={modalStyles.noAnswer}>
                        아직 답변이 등록되지 않았습니다. <br/>조금만 기다려주세요!
                      </div>
                    )}
                  </div>

                  {/* 추가 질문 입력 — 답변을 받은 뒤에도 같은 문의에서 계속 대화 가능 */}
                  <div style={modalStyles.followupBox}>
                    <div style={modalStyles.label}>추가로 질문하기</div>
                    <textarea
                      style={modalStyles.followupTextarea}
                      placeholder="궁금한 점을 추가로 물어보세요."
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value)}
                    />
                    <div style={modalStyles.followupActions}>
                      <input
                        type="file"
                        style={modalStyles.followupFileInput}
                        onChange={(e) => setFollowupFile(e.target.files[0])}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        style={{...modalStyles.followupSendBtn, opacity: sendingFollowup ? 0.6 : 1}}
                        onClick={handleSendFollowup}
                        disabled={sendingFollowup}
                      >
                        <MdSend size={15} /> {sendingFollowup ? '등록 중...' : '등록'}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center', padding:'30px'}}>로딩중...</div>
              )}
            </div>
      </AnimatedModal>

      {/* 하단 네비게이션 */}
      <nav style={styles.bottomNav}>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/mypage')}>
          <span style={styles.navIconWrap}><MdPerson size={25} /></span> 마이페이지
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/main')}>
          <span style={styles.navIconWrap}><MdHome size={25} /></span> 홈
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={handleLogout}>
          <span style={styles.navIconWrap}><MdLogout size={25} /></span> 로그아웃
        </motion.button>
      </nav>
    </div>
  );
}

const styles = {
  pageContainer: {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // height:100dvh 대신 position:fixed + inset:0 사용.
    // iOS PWA(홈 화면 추가) standalone 모드에서는 100dvh가 실제 화면과
    // 미묘하게 어긋나는 경우가 있어, 뷰포트 4면에 항상 정확히 맞춰지는
    // fixed+inset 방식이 더 안전함
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)',
    padding: '10px 15px',
    // 홈 화면에 추가(PWA standalone) 시 상태 표시줄에 내용이 가리지 않도록 안전 영역만큼 추가 여백
    paddingTop: 'calc(10px + env(safe-area-inset-top))',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '55px',
    flexShrink: 0
  },
  // 뒤로가기 버튼 폭과 무관하게 항상 정중앙에 오도록 절대 위치로 배치
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: 0,
    textAlign: 'center',
    fontSize: 'clamp(20px, 5vw, 24px)',
    color: 'white',
    fontWeight: '500',
    pointerEvents: 'none'
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
    position: 'relative',
    zIndex: 1,
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
  reAnswer: {
    color: '#fff', fontWeight: 'bold',
    padding: '4px 8px', borderRadius: '6px',
    backgroundColor: '#e53935', fontSize: '14px'
  },
  
  date: { color: '#666', fontSize:'14px' },
  title: { 
      margin: 0, 
      fontSize: 'clamp(16px, 4vw, 18px)', // 반응형 폰트
      fontWeight: 'bold', 
      color: '#333',
      lineHeight: '1.4'
  },
  // 버튼 글자 길이(마이페이지/홈/로그아웃)가 서로 달라서 flex+space-around로는
  // 가운데 버튼이 정확히 중앙에 오지 않았음. 3등분 grid로 바꿔 항상 정중앙에 오도록 함
  bottomNav: {
    height: '70px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    flexShrink: 0
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    fontSize: 'clamp(17px, 4.5vw, 21px)',
    fontWeight: 'bold',
    color: '#003675',
    cursor: 'pointer',
    padding: '10px'
  },
  navIconWrap: {
    width: '27px',
    height: '27px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  // 내가 보낸 추가 질문 — 조교 답변과 구분되는 톤
  myMessageBox: {
    backgroundColor: '#fff8e1', padding: '15px', borderRadius: '10px',
    color: '#5d4037', lineHeight: '1.6', marginBottom: '10px',
    border: '1px solid #ffe0b2',
    fontSize: '16px'
  },
  senderLabel: { fontSize: '12px', fontWeight: 'bold', opacity: 0.75, marginBottom: '4px' },
  answerDate: { fontSize:'13px', color:'#5472d3', marginTop:'8px', textAlign:'right' },
  noAnswer: {
    color:'#888', padding:'20px', backgroundColor:'#f5f5f5',
    borderRadius:'10px', textAlign:'center', fontSize:'16px', lineHeight:'1.5'
  },
  followupBox: {
    marginTop: '10px',
    paddingTop: '15px',
    borderTop: '1px dashed #ddd'
  },
  followupTextarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  followupActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px'
  },
  followupFileInput: { flex: 1, fontSize: '13px', minWidth: 0 },
  followupSendBtn: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#003675',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default StudentHistory;