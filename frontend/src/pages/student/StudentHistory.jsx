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
import { makeInquiryModalStyles, ACCENTS } from '../../styles/inquiryModalStyles';

// 조교 화면과 같은 모달 구조를 쓰되, 색은 그 문의의 상태를 따른다(답변 대기=주황, 완료=초록)
const pendingModal = makeInquiryModalStyles(ACCENTS.pending);
const completedModal = makeInquiryModalStyles(ACCENTS.completed);

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
                  {item.reply_edited && <span style={styles.reAnswer}>답변 수정됨</span>}
                </div>
                <span style={styles.date}>{item.created_at.split('T')[0]}</span>
              </div>
              <h3 style={styles.title}>{item.title}</h3>
            </motion.div>
          ))
        )}
      </div>

      {/* 상세 보기 팝업 (모달) */}
      {(() => {
      // 문의 상태에 따라 모달 색이 달라진다 (조교 화면과 같은 기준)
      const isDone = selectedInquiry && (selectedInquiry.status === 'COMPLETED' || selectedInquiry.status === '답변 완료');
      const modalStyles = isDone ? completedModal : pendingModal;
      return (
      <AnimatedModal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        overlayStyle={modalStyles.overlay}
        modalStyle={modalStyles.modal}
      >
            <div style={modalStyles.header}>
              <div style={modalStyles.headerTop}>
                <div style={{minWidth: 0}}>
                  <div style={modalStyles.kicker}>문의 상세</div>
                  <h3 style={modalStyles.headerTitle}>{detailData ? detailData.title : ''}</h3>
                </div>
                <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}><MdClose size={18} /></button>
              </div>
              <div style={modalStyles.metaRow}>
                <span style={modalStyles.chipAccent}>{isDone ? '답변 완료' : '답변 대기중'}</span>
                {detailData && detailData.created_at && (
                  <span style={modalStyles.chip}>{detailData.created_at.split('T')[0]}</span>
                )}
                {detailData && detailData.academic_event && (
                  <span style={modalStyles.chip}>
                    <MdCalendarToday size={12} /> {detailData.academic_event.title} (~{detailData.academic_event.end_date})
                  </span>
                )}
              </div>
            </div>

            <div style={modalStyles.content}>
              {detailData ? (
                <>
                  <div style={modalStyles.section}>
                    <div style={modalStyles.sectionHead}>문의 내용<span style={modalStyles.sectionLine} /></div>
                    <div style={modalStyles.qText}>{detailData.content}</div>
                    {detailData.attachment && (
                      <a href={`${API_BASE}${detailData.attachment}`} target="_blank" rel="noopener noreferrer" style={modalStyles.fileLink}>
                        <MdDownload size={14} /> 내 첨부파일
                      </a>
                    )}
                  </div>

                  <div style={modalStyles.section}>
                    <div style={modalStyles.sectionHead}>대화<span style={modalStyles.sectionLine} /></div>
                    <div style={modalStyles.thread}>
                      {detailData.replies && detailData.replies.length > 0 ? (
                        detailData.replies.map(reply => {
                          // 학생 화면이므로 '나'가 오른쪽, 조교가 왼쪽
                          const isMine = reply.sender_role === 'student';
                          return (
                            <div key={reply.id} style={isMine ? modalStyles.bubbleWrapRight : modalStyles.bubbleWrapLeft}>
                              <div style={modalStyles.who}>
                                {isMine ? '나의 추가 질문' : '조교 답변'} · {reply.created_at.split('T')[0]}
                                {reply.updated_at && !isMine && ' · 수정됨'}
                              </div>
                              <div style={isMine ? modalStyles.bubbleAccent : modalStyles.bubbleMuted}>
                                {reply.content}
                                {reply.attachment && (
                                  <div>
                                    <a
                                      href={`${API_BASE}${reply.attachment}`} target="_blank" rel="noopener noreferrer"
                                      style={{...modalStyles.bubbleFile, color: isMine ? '#fff' : '#003675'}}
                                    >
                                      <MdAttachFile size={12} /> 첨부파일
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={modalStyles.emptyThread}>
                          아직 답변이 등록되지 않았습니다. 조금만 기다려주세요.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 추가 질문 입력 — 답변을 받은 뒤에도 같은 문의에서 계속 대화 가능 */}
                  <div style={modalStyles.sectionLast}>
                    <div style={modalStyles.sectionHead}>추가로 질문하기<span style={modalStyles.sectionLine} /></div>
                    <textarea
                      style={modalStyles.textarea}
                      placeholder="궁금한 점을 추가로 물어보세요."
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value)}
                    />
                    <div style={modalStyles.charCount}>{followupText.length}자</div>
                    <div style={modalStyles.footRow}>
                      <label style={followupFile ? modalStyles.attachBtnActive : modalStyles.attachBtn}>
                        <MdAttachFile size={15} />
                        {followupFile ? followupFile.name : '파일 첨부'}
                        <input type="file" style={{display:'none'}} onChange={(e) => setFollowupFile(e.target.files[0])} />
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        style={{...modalStyles.submitBtn, opacity: sendingFollowup ? 0.6 : 1,
                                display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px'}}
                        onClick={handleSendFollowup}
                        disabled={sendingFollowup}
                      >
                        <MdSend size={15} /> {sendingFollowup ? '등록 중...' : '질문 등록'}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center', padding:'30px'}}>로딩중...</div>
              )}
            </div>
      </AnimatedModal>
      );
      })()}

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

export default StudentHistory;