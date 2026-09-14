// src/pages/ta/TAPending.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdCalendarToday, MdArrowDownward, MdArrowUpward, MdCelebration, MdPushPin, MdClose, MdPerson, MdAttachFile, MdSmartToy } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import AttachmentPreview, { attachmentKind } from '../../components/AttachmentPreview';
import { API_BASE } from '../../config';
import { linkify } from '../../utils/linkify';
import { makeInquiryModalStyles, ACCENTS } from '../../styles/inquiryModalStyles';

const AI_BASE = 'https://wjsdbqls-capstone-ai.hf.space';

function TAPending() {
  const [inquiries, setInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sortType, setSortType] = useState('latest');
  const [aiCandidates, setAiCandidates] = useState([]);
  const [aiKeywords, setAiKeywords] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // 두 요청이 서로 의존하지 않는데 순서대로 기다리고 있었어서 병렬로 변경 (로딩 시간 절반으로)
      const [resInq, resEvents] = await Promise.all([
        axios.get(`${API_BASE}/inquiries?status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/academic-events`),
      ]);
      const pendingList = resInq.data;
      const eventMap = {}; resEvents.data.forEach(ev => { eventMap[ev.id] = ev; });
      setAcademicEvents(eventMap);
      setInquiries(sortList(pendingList, 'latest', eventMap));
    } catch (error) {}
  };
  useEffect(() => { fetchData(); }, []);

  const sortList = (list, type, eventMap) => {
    const sorted = [...list];
    if (type === 'latest') sorted.sort((a, b) => b.id - a.id);
    else if (type === 'old') sorted.sort((a, b) => a.id - b.id);
    else if (type === 'deadline') {
      sorted.sort((a, b) => {
        const dateA = a.academic_event_id && eventMap[a.academic_event_id] ? eventMap[a.academic_event_id].end_date : '9999-12-31';
        const dateB = b.academic_event_id && eventMap[b.academic_event_id] ? eventMap[b.academic_event_id].end_date : '9999-12-31';
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return b.id - a.id; 
      });
    }
    return sorted;
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const [qRes, rRes] = await Promise.all([
        axios.get(`${API_BASE}/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/inquiries/${id}/replies`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const inquiry = qRes.data;
      const replies = rRes.data;
      setSelectedInquiry(inquiry);
      setThreadReplies(replies);
      setReplyContent("");
      setReplyFile(null);
      setAiCandidates([]);
      setAiKeywords([]);

      // 답변할 대상 텍스트: 학생이 추가 질문을 올렸다면 그 내용, 없으면(첫 답변) 원래 문의 내용
      const lastMsg = replies.length > 0 ? replies[replies.length - 1] : null;
      const targetText = (lastMsg && lastMsg.sender_role === 'student') ? lastMsg.content : inquiry.content;

      // AI 답변 후보 + 키워드 하이라이팅 동시 호출
      setAiLoading(true);
      try {
        const [predictRes, highlightRes] = await Promise.allSettled([
          axios.post(`${AI_BASE}/api/ai/predict`, { question: `${inquiry.title} ${targetText}` }),
          axios.post(`${AI_BASE}/api/ai/highlight`, { question: targetText }),
        ]);
        if (predictRes.status === 'fulfilled') setAiCandidates(predictRes.value.data.candidates || []);
        if (highlightRes.status === 'fulfilled') setAiKeywords(highlightRes.value.data.highlights || []);
      } catch (_) {}
      setAiLoading(false);
    } catch (error) { alert("오류 발생"); }
  };

  // 키워드를 하이라이팅해서 렌더링
  const renderHighlighted = (text, keywords) => {
    // 모달이 닫히는 애니메이션 도중 selectedInquiry가 null이 되면서
    // text가 undefined로 들어와 .split()에서 크래시 나는 걸 방지
    if (!text) return null;
    // 하이라이팅할 키워드가 없으면 링크 변환만 적용
    if (!keywords || keywords.length === 0) return <span>{linkify(text)}</span>;
    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ backgroundColor: '#fff176', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
        // 키워드가 아닌 구간에서만 URL을 링크로 바꾼다 (하이라이트와 겹치지 않게)
        : <span key={i}>{linkify(part)}</span>
    );
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('content', replyContent);
    if (replyFile) formData.append('file', replyFile);
    try {
      await axios.post(`${API_BASE}/inquiries/${selectedInquiry.id}/replies`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert("답변 완료"); setSelectedInquiry(null); fetchData(); 
    } catch (error) { alert("등록 실패"); }
  };

  return (
    <>
      <div style={styles.pageTitle}>대기중인 문의</div>
      <div style={styles.sortBar}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('deadline'); setInquiries(sortList(inquiries, 'deadline', academicEvents)); }} style={sortType === 'deadline' ? styles.activeSortBtn : styles.sortBtn}><MdCalendarToday size={13} /> 마감순</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('latest'); setInquiries(sortList(inquiries, 'latest', academicEvents)); }} style={sortType === 'latest' ? styles.activeSortBtn : styles.sortBtn}><MdArrowDownward size={13} /> 최신순</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('old'); setInquiries(sortList(inquiries, 'old', academicEvents)); }} style={sortType === 'old' ? styles.activeSortBtn : styles.sortBtn}><MdArrowUpward size={13} /> 오래된순</motion.button>
      </div>
      <div style={styles.listArea}>
          {inquiries.length === 0 ? <div style={styles.emptyMessage}><MdCelebration size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />대기 중인 문의가 없습니다.</div> :
              inquiries.map((item) => {
                  const eventInfo = item.academic_event_id ? academicEvents[item.academic_event_id] : null;
                  return (
                      <motion.div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)} whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.99 }}>
                          <div style={styles.cardHeader}>
                              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                                  <span style={styles.statusBadge}>답변 대기</span>
                                  {eventInfo && <span style={styles.eventBadge}>D-day: {eventInfo.end_date}</span>}
                              </div>
                              <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                          </div>
                          <div style={styles.title}>{item.title}</div>
                          {eventInfo && <div style={styles.relatedEvent}><MdPushPin size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{eventInfo.title}</div>}
                          {/* 목록 카드에 학생 정보 복구 */}
                          <div style={styles.writerInfo}>
                              {item.author_info ? `${item.author_info.department} ${item.author_info.grade}학년 ${item.author_info.name} (${item.author_info.student_no})` : `ID: ${item.user_id}`}
                          </div>
                      </motion.div>
                  );
              })
          }
      </div>
      <AnimatedModal isOpen={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} overlayStyle={modalStyles.overlay} modalStyle={modalStyles.modal}>
            {(() => {
              // AnimatedModal의 닫힘 애니메이션 도중에도 selectedInquiry가 null이 될 수 있어
              // 크래시 방지용 안전한 참조 객체를 사용
              const inq = selectedInquiry || {};
              const lastMsg = threadReplies.length > 0 ? threadReplies[threadReplies.length - 1] : null;
              const isFollowup = lastMsg && lastMsg.sender_role === 'student';
              return (
            <>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerTop}>
                <div style={{minWidth: 0}}>
                  <div style={modalStyles.kicker}>{isFollowup ? '추가 질문 답변' : '답변 작성'}</div>
                  <h3 style={modalStyles.headerTitle}>{inq.title}</h3>
                </div>
                <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}><MdClose size={18} /></button>
              </div>
              <div style={modalStyles.metaRow}>
                {inq.author_info ? (
                  <>
                    <span style={modalStyles.chip}>{inq.author_info.department} · {inq.author_info.grade}학년</span>
                    <span style={modalStyles.chip}><MdPerson size={12} /> {inq.author_info.name} ({inq.author_info.student_no})</span>
                  </>
                ) : (
                  <span style={modalStyles.chip}><MdPerson size={12} /> ID: {inq.user_id}</span>
                )}
                {inq.academic_event_id && academicEvents[inq.academic_event_id] && (
                  <span style={modalStyles.chipAccent}>
                    <MdCalendarToday size={12} /> {academicEvents[inq.academic_event_id].title}
                  </span>
                )}
              </div>
            </div>

            <div style={modalStyles.content}>
              <div style={modalStyles.section}>
                <div style={modalStyles.sectionHead}>문의 내용<span style={modalStyles.sectionLine} /></div>
                <div style={modalStyles.qText}>
                  {isFollowup ? inq.content : renderHighlighted(inq.content, aiKeywords)}
                </div>
                {inq.attachment && (
                  <div style={{marginTop: '13px', maxWidth: '420px'}}>
                    <AttachmentPreview url={`${API_BASE}${inq.attachment}`} name={inq.attachment} maxHeight={260} />
                  </div>
                )}
              </div>

              {/* 대화 스레드 — 학생은 왼쪽, 조교는 오른쪽 */}
              {threadReplies.length > 0 && (
                <div style={modalStyles.section}>
                  <div style={modalStyles.sectionHead}>대화<span style={modalStyles.sectionLine} /></div>
                  <div style={modalStyles.thread}>
                    {threadReplies.map((msg) => {
                      const isStudent = msg.sender_role === 'student';
                      const isLast = msg.id === lastMsg.id;
                      return (
                        <div key={msg.id} style={isStudent ? modalStyles.bubbleWrapLeft : modalStyles.bubbleWrapRight}>
                          <div style={modalStyles.who}>{isStudent ? '학생 추가 질문' : '조교 답변'}</div>
                          <div style={isStudent ? modalStyles.bubbleMuted : modalStyles.bubbleAccent}>
                            {isStudent && isLast ? renderHighlighted(msg.content, aiKeywords) : linkify(msg.content, { color: isStudent ? '#003675' : '#fff' })}
                            {msg.attachment && (
                              <div>
                                {attachmentKind(msg.attachment) === 'image' ? (
                                  // 채팅처럼 이미지는 말풍선 안에서 바로 보여준다
                                  <a href={`${API_BASE}${msg.attachment}`} target="_blank" rel="noreferrer">
                                    <img src={`${API_BASE}${msg.attachment}`} alt="첨부 이미지"
                                         style={{display:'block', marginTop:'8px', maxWidth:'100%', maxHeight:'200px',
                                                 borderRadius:'10px', cursor:'zoom-in'}} />
                                  </a>
                                ) : (
                                  <a
                                    href={`${API_BASE}${msg.attachment}`} target="_blank" rel="noreferrer"
                                    style={{...modalStyles.bubbleFile, color: isStudent ? '#003675' : '#fff'}}
                                  >
                                    <MdAttachFile size={12} /> 첨부파일
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI 답변 후보 */}
              {(aiLoading || aiCandidates.length > 0) && (
                <div style={modalStyles.section}>
                  <div style={modalStyles.sectionHead}>AI 추천 답변<span style={modalStyles.sectionLine} /></div>
                  <div style={modalStyles.aiCard}>
                    <div style={modalStyles.aiHead}>
                      <MdSmartToy size={15} /> {aiLoading ? '유사 문의를 찾는 중...' : '유사 문의에서 찾은 답변 후보'}
                    </div>
                    {!aiLoading && aiCandidates.map((c, i) => {
                      const plainText = c.answer_html
                        ? c.answer_html.replace(/<[^>]+>/g, '').trim()
                        : '';
                      return (
                        <div key={i} style={modalStyles.aiRow}>
                          <div style={modalStyles.aiRank}>{i + 1}</div>
                          <div style={modalStyles.aiText}>{plainText}</div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={modalStyles.aiUseBtn}
                            onClick={() => setReplyContent(plainText)}
                          >사용</motion.button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={modalStyles.sectionLast}>
                <div style={modalStyles.sectionHead}>답변 작성<span style={modalStyles.sectionLine} /></div>
                <textarea
                  style={modalStyles.textarea}
                  placeholder="학생에게 전달할 답변을 입력하세요"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div style={modalStyles.charCount}>{replyContent.length}자</div>
                <div style={modalStyles.footRow}>
                  {/* 브라우저 기본 파일 위젯 대신 label로 감싼 숨은 input */}
                  <label style={replyFile ? modalStyles.attachBtnActive : modalStyles.attachBtn}>
                    <MdAttachFile size={15} />
                    {replyFile ? replyFile.name : '파일 첨부'}
                    <input
                      type="file"
                      onChange={(e) => setReplyFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    style={modalStyles.submitBtn}
                    onClick={handleSubmitReply}
                  >답변 등록</motion.button>
                </div>
              </div>
            </div>
            </>
              );
            })()}
      </AnimatedModal>
    </>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '15px' },
  sortBar: { display: 'flex', gap: '8px', marginBottom: '15px', backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', flexWrap: 'wrap' },
  sortBtn: { padding: '6px 12px', border: '1px solid #ced4da', borderRadius: '20px', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', color: '#495057', fontWeight:'500' },
  activeSortBtn: { padding: '6px 12px', border: '1px solid #003675', borderRadius: '20px', background: '#003675', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '2px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight:'bold' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '15px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.9)', borderLeft: '5px solid #ff9800' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems:'center' },
  statusBadge: { color: '#ff9800', fontWeight: 'bold', fontSize: '11px', backgroundColor:'#fff3e0', padding:'3px 6px', borderRadius:'4px' },
  eventBadge: { backgroundColor: '#ffe0b2', color: '#e65100', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', fontWeight:'bold' },
  date: { color: '#666', fontSize: '11px' },
  title: { fontSize: '15px', fontWeight: 'bold', color:'#212529', marginBottom:'4px' },
  relatedEvent: { fontSize: '12px', color: '#e65100', marginTop: '4px', fontWeight:'500' },
  writerInfo: { fontSize: '12px', color: '#495057', marginTop: '6px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }
};

// 대기중 화면은 목록 카드와 같은 주황 계열
const modalStyles = makeInquiryModalStyles(ACCENTS.pending, { maxWidth: '1240px' });

export default TAPending;