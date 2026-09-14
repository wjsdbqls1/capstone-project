// src/pages/ta/TACompleted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdCalendarToday, MdSearch, MdClose, MdPerson, MdAttachFile, MdEdit } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import AttachmentPreview, { attachmentKind } from '../../components/AttachmentPreview';
import '../../App.css';
import { API_BASE } from '../../config';
import { makeInquiryModalStyles, ACCENTS } from '../../styles/inquiryModalStyles';

function TACompleted() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [academicEvents, setAcademicEvents] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => { fetchInquiries(); }, []);

  useEffect(() => {
    let result = [...inquiries];
    if (searchTerm) {
      result = result.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) || (item.author_info && item.author_info.name.includes(searchTerm)));
    }
    if (gradeFilter !== "all") {
      result = result.filter(item => item.author_info && item.author_info.grade === parseInt(gradeFilter));
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(item => {
        const itemDate = new Date(item.created_at);
        const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        if (dateFilter === 'today') return itemDateStart.getTime() === todayStart.getTime();
        if (dateFilter === 'week') {
          const day = now.getDay(); 
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff)); monday.setHours(0,0,0,0);
          return itemDate >= monday;
        }
        if (dateFilter === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (dateFilter === 'year') return itemDate.getFullYear() === now.getFullYear();
        return true;
      });
    }
    setFilteredInquiries(result);
  }, [searchTerm, gradeFilter, dateFilter, inquiries]);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      // 두 요청이 서로 의존하지 않는데 순서대로 기다리고 있었어서 병렬로 변경 (로딩 시간 절반으로)
      const [response, resEvents] = await Promise.all([
        axios.get(`${API_BASE}/inquiries?status=completed`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/academic-events`),
      ]);
      const completedList = response.data;
      const eventMap = {}; resEvents.data.forEach(ev => { eventMap[ev.id] = ev; }); setAcademicEvents(eventMap);
      const sortedList = completedList.sort((a, b) => b.id - a.id);
      setInquiries(sortedList); setFilteredInquiries(sortedList);
    } catch (error) { console.error(error); }
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const qRes = await axios.get(`${API_BASE}/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const rRes = await axios.get(`${API_BASE}/inquiries/${id}/replies`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry({ ...qRes.data, replies: rRes.data }); setEditingReplyId(null);
    } catch (error) { alert("상세 정보를 불러오지 못했습니다."); }
  };

  const handleUpdateReply = async (inquiryId, replyId) => {
    if (!editContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("content", editContent);
    if (editFile) formData.append("file", editFile);
    try {
      await axios.put(`${API_BASE}/inquiries/${inquiryId}/replies/${replyId}`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      alert("수정되었습니다."); handleSelect(inquiryId);
    } catch (error) { alert("수정 실패"); }
  };

  return (
    <>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>처리 완료 문의</div>
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="all">전체 기간</option><option value="today">오늘</option><option value="week">이번 주</option><option value="month">이번 달</option><option value="year">올해</option>
                </select>
                <select style={styles.select} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="all">전체 학년</option><option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option><option value="4">4학년</option>
                </select>
            </div>
            <div style={styles.searchWrapper}>
                <MdSearch size={16} color="#666" />
                <input type="text" placeholder="이름 또는 제목 검색..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
        </div>
        <div style={styles.listArea}>
          {filteredInquiries.length === 0 ? (
            <div style={styles.emptyMessage}>{searchTerm || gradeFilter !== 'all' || dateFilter !== 'all' ? "검색 조건에 맞는 문의가 없습니다." : "완료된 문의가 없습니다."}</div>
          ) : (
            filteredInquiries.map((item) => (
              <motion.div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)} whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.99 }}>
                <div style={styles.cardHeader}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={styles.statusDone}>답변 완료</span>
                    {item.reply_edited && (<span style={styles.reAnswer}>답변 수정됨</span>)}
                    {item.author_info && (<span style={styles.nameTag}>{item.author_info.name}</span>)}
                  </div>
                  <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                </div>
                <h3 style={styles.title}>{item.title}</h3>
                {/* 목록 카드에 학생 정보 복구 */}
                <div style={styles.writerInfo}>
                    {item.author_info ? `${item.author_info.department} ${item.author_info.grade}학년 ${item.author_info.name} (${item.author_info.student_no})` : `ID: ${item.user_id}`}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      <AnimatedModal isOpen={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} overlayStyle={modalStyles.overlay} modalStyle={modalStyles.modal}>
        {(() => {
          const inq = selectedInquiry || {};
          return (
          <>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerTop}>
                <div style={{minWidth: 0}}>
                  <div style={modalStyles.kicker}>문의 상세</div>
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
                <span style={modalStyles.chipAccent}>답변 완료</span>
                {inq.academic_event_id && academicEvents[inq.academic_event_id] && (
                  <span style={modalStyles.chip}>
                    <MdCalendarToday size={12} /> {academicEvents[inq.academic_event_id].title} (~{academicEvents[inq.academic_event_id].end_date})
                  </span>
                )}
              </div>
            </div>

            <div style={modalStyles.content}>
              <div style={modalStyles.section}>
                <div style={modalStyles.sectionHead}>문의 내용<span style={modalStyles.sectionLine} /></div>
                <div style={modalStyles.qText}>{inq.content}</div>
                {inq.attachment && (
                  <div style={{marginTop: '13px', maxWidth: '420px'}}>
                    <AttachmentPreview url={`${API_BASE}${inq.attachment}`} name={inq.attachment} maxHeight={260} />
                  </div>
                )}
              </div>

              <div style={modalStyles.sectionLast}>
                <div style={modalStyles.sectionHead}>대화<span style={modalStyles.sectionLine} /></div>
                <div style={modalStyles.thread}>
                  {!inq.replies?.length && <div style={modalStyles.emptyThread}>아직 대화 내역이 없습니다.</div>}
                  {inq.replies?.map(r => {
                    const isStudent = r.sender_role === 'student';
                    // 수정 중일 때는 말풍선 대신 입력 폼을 전체 폭으로 펼친다
                    if (editingReplyId === r.id) {
                      return (
                        <div key={r.id}>
                          <div style={{...modalStyles.who, textAlign: 'right'}}>조교 답변 수정</div>
                          <textarea
                            style={modalStyles.editTextarea}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div style={modalStyles.editActions}>
                            <button onClick={() => setEditingReplyId(null)} style={modalStyles.cancelBtn}>취소</button>
                            <button onClick={() => handleUpdateReply(inq.id, r.id)} style={modalStyles.saveBtn}>저장</button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={r.id} style={isStudent ? modalStyles.bubbleWrapLeft : modalStyles.bubbleWrapRight}>
                        <div style={modalStyles.who}>{isStudent ? '학생 추가 질문' : '조교 답변'}</div>
                        <div style={isStudent ? modalStyles.bubbleMuted : modalStyles.bubbleAccent}>
                          {r.content}
                          {r.attachment && (
                            <div>
                              {attachmentKind(r.attachment) === 'image' ? (
                                  // 채팅처럼 이미지는 말풍선 안에서 바로 보여준다
                                  <a href={`${API_BASE}${r.attachment}`} target="_blank" rel="noreferrer">
                                    <img src={`${API_BASE}${r.attachment}`} alt="첨부 이미지"
                                         style={{display:'block', marginTop:'8px', maxWidth:'100%', maxHeight:'200px',
                                                 borderRadius:'10px', cursor:'zoom-in'}} />
                                  </a>
                                ) : (
                                  <a
                                    href={`${API_BASE}${r.attachment}`} target="_blank" rel="noreferrer"
                                    style={{...modalStyles.bubbleFile, color: isStudent ? '#003675' : '#fff'}}
                                  >
                                    <MdAttachFile size={12} /> 첨부파일
                                  </a>
                                )}
                            </div>
                          )}
                        </div>
                        {!isStudent && (
                          <button
                            onClick={() => { setEditingReplyId(r.id); setEditContent(r.content); }}
                            style={modalStyles.editBtn}
                          ><MdEdit size={11} /> 수정하기</button>
                        )}
                      </div>
                    );
                  })}
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
  glassBox: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '15px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px', backgroundColor: 'rgba(255, 255, 255, 0.4)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' },
  filterGroup: { display: 'flex', gap: '8px' },
  select: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', flexGrow: 1, minWidth: '150px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', width: '100%', backgroundColor: 'transparent' },
  listArea: { flex: 1, overflowY: 'auto', paddingRight: '2px', minHeight: 0 },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: '15px', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.9)', borderLeft: '5px solid #4caf50' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems:'center' },
  statusDone: { color: '#2e7d32', fontWeight: 'bold', fontSize: '11px', backgroundColor:'#e8f5e9', padding:'3px 6px', borderRadius:'4px' },
  reAnswer: { color: '#fff', fontWeight: 'bold', fontSize: '11px', backgroundColor:'#e53935', padding:'3px 7px', borderRadius:'4px' },
  nameTag: { fontSize: '12px', fontWeight: 'bold', color: '#495057' },
  date: { color: '#666', fontSize: '11px' },
  title: { fontSize: '15px', fontWeight: 'bold', color:'#212529', marginBottom:'4px' },
  writerInfo: { fontSize: '12px', color: '#495057', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }
};

// 처리 완료 화면은 목록 카드와 같은 초록 계열
const modalStyles = makeInquiryModalStyles(ACCENTS.completed, { maxWidth: '1240px' });

export default TACompleted;