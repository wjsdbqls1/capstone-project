// src/pages/ta/TAInquiryWork.jsx
// 대기중 문의와 진행중 문의는 조교가 하는 일(답변 작성)이 같아서 화면을 하나로 쓰고,
// 목록을 어디서 받아올지와 색·문구만 mode로 갈아끼운다.
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdCalendarToday, MdArrowDownward, MdArrowUpward, MdCelebration, MdPushPin, MdClose, MdPerson, MdSmartToy, MdCheckCircle } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import AttachmentPreview, { BubbleAttachments } from '../../components/AttachmentPreview';
import { API_BASE } from '../../config';
import { linkify } from '../../utils/linkify';
import { makeInquiryModalStyles, ACCENTS } from '../../styles/inquiryModalStyles';

import { appendFiles, attachmentsOf, errorMessage } from '../../utils/upload';
import FilePicker from '../../components/FilePicker';
const AI_BASE = 'https://wjsdbqls-capstone-ai.hf.space';

const MODES = {
  pending: {
    title: '대기중인 문의',
    query: 'pending',
    accent: ACCENTS.pending,
    line: '#ff9800',
    badge: { color: '#ff9800', backgroundColor: '#fff3e0' },
    badgeText: '답변 대기',
    empty: '대기 중인 문의가 없습니다.',
    afterReply: '답변을 등록했습니다. 진행중인 문의로 옮겨집니다.',
  },
  in_progress: {
    title: '진행중인 문의',
    query: 'in_progress',
    accent: ACCENTS.inProgress,
    line: '#1976d2',
    badge: { color: '#1565c0', backgroundColor: '#e3f2fd' },
    badgeText: '진행중',
    empty: '진행중인 문의가 없습니다.',
    afterReply: '답변을 등록했습니다. 완료 처리하기 전까지 진행중에 남아 있습니다.',
  },
};

function TAInquiryWork({ mode }) {
  const cfg = MODES[mode];
  // 화면 색이 mode에 따라 달라지므로 모달 스타일도 같이 만들어 둔다
  const modalStyles = useMemo(
    () => makeInquiryModalStyles(cfg.accent, { maxWidth: '1240px' }),
    [cfg]
  );

  const [inquiries, setInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sortType, setSortType] = useState('latest');
  const [aiCandidates, setAiCandidates] = useState([]);
  const [aiKeywords, setAiKeywords] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // 두 요청이 서로 의존하지 않으므로 병렬로 부른다
      const [resInq, resEvents] = await Promise.all([
        axios.get(`${API_BASE}/inquiries?status=${cfg.query}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/academic-events`),
      ]);
      const list = resInq.data;
      const eventMap = {}; resEvents.data.forEach(ev => { eventMap[ev.id] = ev; });
      setAcademicEvents(eventMap);
      setInquiries(sortList(list, 'latest', eventMap));
    } catch (error) {}
  };
  // 메뉴를 옮겨 다니며 같은 컴포넌트가 재사용되므로 mode가 바뀌면 다시 불러온다
  useEffect(() => { setSortType('latest'); fetchData(); }, [mode]);

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
      setReplyFiles([]);
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

  // complete=false면 진행중으로 남아 대화를 계속 이어갈 수 있고,
  // true면 그 답변을 끝으로 문의를 닫는다.
  const handleSubmitReply = async (complete) => {
    if (!replyContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('content', replyContent);
    formData.append('complete', complete ? 'true' : 'false');
    appendFiles(formData, replyFiles);
    setSending(true);
    try {
      await axios.post(`${API_BASE}/inquiries/${selectedInquiry.id}/replies`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      alert(complete ? '답변을 등록하고 완료 처리했습니다.' : cfg.afterReply);
      setSelectedInquiry(null);
      fetchData();
    } catch (error) { alert(errorMessage(error, "등록 실패")); }
    finally { setSending(false); }
  };

  // 문의를 끝내는 버튼은 오른쪽 위 '완료 처리' 하나로 모았다.
  // 답변을 써 둔 상태면 그 답변까지 등록하면서 닫고(써 둔 글이 조용히 사라지면 안 되므로),
  // 입력란이 비어 있으면 상태만 완료로 바꾼다(전화로 이미 해결한 문의 등).
  const handleComplete = async () => {
    const draft = replyContent.trim();
    const ok = window.confirm(draft
      ? '작성한 답변을 등록하고 이 문의를 완료 처리할까요?'
      : '새 답변 없이 이 문의를 완료 처리할까요?');
    if (!ok) return;

    if (draft) { await handleSubmitReply(true); return; }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('status', 'completed');
    setSending(true);
    try {
      await axios.patch(`${API_BASE}/inquiries/${selectedInquiry.id}/status`, formData, { headers: { Authorization: `Bearer ${token}` } });
      alert('완료 처리했습니다.');
      setSelectedInquiry(null);
      fetchData();
    } catch (error) { alert(errorMessage(error, "완료 처리 실패")); }
    finally { setSending(false); }
  };

  // 헤더(색 배경) 위에 올라가는 버튼이라 흰 칩과 같은 결로 맞춘다
  const headerBtn = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(255,255,255,0.94)', border: '1px solid #fff',
    color: cfg.accent.chipText, borderRadius: '9px', padding: '7px 11px',
    fontSize: '12.5px', fontWeight: 800, cursor: 'pointer',
    whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
  };

  return (
    <>
      <div style={styles.pageTitle}>{cfg.title}</div>
      <div style={styles.sortBar}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('deadline'); setInquiries(sortList(inquiries, 'deadline', academicEvents)); }} style={sortType === 'deadline' ? styles.activeSortBtn : styles.sortBtn}><MdCalendarToday size={13} /> 마감순</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('latest'); setInquiries(sortList(inquiries, 'latest', academicEvents)); }} style={sortType === 'latest' ? styles.activeSortBtn : styles.sortBtn}><MdArrowDownward size={13} /> 최신순</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSortType('old'); setInquiries(sortList(inquiries, 'old', academicEvents)); }} style={sortType === 'old' ? styles.activeSortBtn : styles.sortBtn}><MdArrowUpward size={13} /> 오래된순</motion.button>
      </div>
      <div style={styles.listArea}>
          {inquiries.length === 0 ? <div style={styles.emptyMessage}><MdCelebration size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{cfg.empty}</div> :
              inquiries.map((item) => {
                  const eventInfo = item.academic_event_id ? academicEvents[item.academic_event_id] : null;
                  return (
                      <motion.div key={item.id} style={{...styles.card, borderLeft: `5px solid ${cfg.line}`}} onClick={() => handleSelect(item.id)} whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.99 }}>
                          <div style={styles.cardHeader}>
                              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                                  <span style={{...styles.statusBadge, ...cfg.badge}}>{cfg.badgeText}</span>
                                  {/* 진행중인데 학생이 마지막으로 말했다면 조교가 답할 차례 */}
                                  {mode === 'in_progress' && item.awaiting_reply && (
                                    <span style={styles.waitingBadge}>학생 질문 대기</span>
                                  )}
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
                <div style={{display:'flex', alignItems:'center', gap:'8px', flexShrink:0}}>
                  {/* 문의를 끝내는 버튼은 대기중·진행중 통틀어 이것 하나뿐이다 */}
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleComplete} disabled={sending} style={headerBtn}>
                    <MdCheckCircle size={14} /> 완료 처리
                  </motion.button>
                  <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}><MdClose size={18} /></button>
                </div>
              </div>
              <div style={modalStyles.metaRow}>
                <span style={modalStyles.chipAccent}>{cfg.badgeText}</span>
                {inq.author_info ? (
                  <>
                    <span style={modalStyles.chip}>{inq.author_info.department} · {inq.author_info.grade}학년</span>
                    <span style={modalStyles.chip}><MdPerson size={12} /> {inq.author_info.name} ({inq.author_info.student_no})</span>
                  </>
                ) : (
                  <span style={modalStyles.chip}><MdPerson size={12} /> ID: {inq.user_id}</span>
                )}
                {inq.academic_event_id && academicEvents[inq.academic_event_id] && (
                  <span style={modalStyles.chip}>
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
                {attachmentsOf(inq, 'inquiry', API_BASE).map((a, i) => (
                  <div key={i} style={{marginTop: '13px', maxWidth: '420px'}}>
                    <AttachmentPreview url={a.url} name={a.name} maxHeight={260} />
                  </div>
                ))}
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
                            <BubbleAttachments items={attachmentsOf(msg, 'inquiry', API_BASE)} color={isStudent ? '#003675' : '#fff'} linkStyle={modalStyles.bubbleFile} />
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

              {/* 모달이 창 높이에 맞춰 커질 때 남는 공간을 답변 입력창이 가져간다.
                  AI 추천이 비어 그 영역이 통째로 사라지면 아래가 빈 칸으로 남았고,
                  큰 화면에서는 입력창이 넓어져 긴 답변을 쓰기도 편하다. */}
              <div style={{...modalStyles.sectionLast, flex: 1, minHeight: '280px', display: 'flex', flexDirection: 'column'}}>
                <div style={modalStyles.sectionHead}>답변 작성<span style={modalStyles.sectionLine} /></div>
                <textarea
                  style={{...modalStyles.textarea, flex: 1}}
                  placeholder="학생에게 전달할 답변을 입력하세요"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div style={modalStyles.charCount}>{replyContent.length}자</div>
                {/* 브라우저 기본 파일 위젯 대신 label로 감싼 숨은 input */}
                <div style={modalStyles.footRow}>
                  <FilePicker files={replyFiles} onChange={setReplyFiles} style={modalStyles.attachBtn} activeStyle={modalStyles.attachBtnActive} />
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    style={{...modalStyles.submitBtn, opacity: sending ? 0.6 : 1}}
                    onClick={() => handleSubmitReply(false)}
                    disabled={sending}
                  >답변 등록</motion.button>
                </div>
                <div style={styles.hint}>
                  ‘답변 등록’을 누르면 진행중인 문의로 남아 대화를 이어갈 수 있습니다.
                  이 문의를 끝내려면 오른쪽 위 ‘완료 처리’를 눌러주세요 — 써 둔 답변이 있으면 함께 등록됩니다.
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
  card: { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '15px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.9)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems:'center' },
  statusBadge: { fontWeight: 'bold', fontSize: '11px', padding:'3px 6px', borderRadius:'4px' },
  // 조교가 답할 차례라는 신호는 다른 배지보다 세게 보여야 놓치지 않는다
  waitingBadge: { color: '#fff', fontWeight: 'bold', fontSize: '11px', backgroundColor: '#e53935', padding: '3px 7px', borderRadius: '4px' },
  eventBadge: { backgroundColor: '#ffe0b2', color: '#e65100', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', fontWeight:'bold' },
  date: { color: '#666', fontSize: '11px' },
  title: { fontSize: '15px', fontWeight: 'bold', color:'#212529', marginBottom:'4px' },
  relatedEvent: { fontSize: '12px', color: '#e65100', marginTop: '4px', fontWeight:'500' },
  writerInfo: { fontSize: '12px', color: '#495057', marginTop: '6px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' },
  hint: { fontSize: '12px', color: '#868e96', marginTop: '10px', lineHeight: 1.5 },
};

export default TAInquiryWork;
