// src/pages/ta/TAFaqManage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdSearch, MdClose, MdAttachFile, MdAdd } from 'react-icons/md';
import AnimatedModal from '../../components/AnimatedModal';
import AttachmentPreview from '../../components/AttachmentPreview';
import '../../App.css';
import { API_BASE } from '../../config';
import { linkify } from '../../utils/linkify';
import { makeInquiryModalStyles, ACCENTS } from '../../styles/inquiryModalStyles';

import { appendFiles, attachmentsOf, errorMessage } from '../../utils/upload';
import FilePicker from '../../components/FilePicker';
const m = makeInquiryModalStyles(ACCENTS.navy, { maxWidth: '1240px' });

const formatDate = (v) => (v ? String(v).split('T')[0] : '');

function TAFaqManage() {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState(""); 
  const [dateFilter, setDateFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer_html: "" });
  const [files, setFiles] = useState([]);
  // 카드를 누르면 뜨는 상세 모달 (목록 항목을 그대로 사용)
  const [detail, setDetail] = useState(null);

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE}/faqs`, config);
      setFaqs(response.data);
      setFilteredFaqs(response.data);
    } catch (error) { console.error("FAQ 로딩 실패:", error); }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...faqs];

    // 1. 검색어 필터
    if (searchTerm) {
      result = result.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer_html.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. 날짜 필터 (created_at)
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(item => {
        const dateStr = item.created_at || item.posted_date;
        if (!dateStr) return false;

        const itemDate = new Date(dateStr);
        const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        if (dateFilter === 'today') return itemDateStart.getTime() === todayStart.getTime();
        if (dateFilter === 'week') {
          const day = now.getDay(); 
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          return itemDate >= monday;
        }
        if (dateFilter === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (dateFilter === 'year') return itemDate.getFullYear() === now.getFullYear();
        return true;
      });
    }

    setFilteredFaqs(result);
  }, [searchTerm, dateFilter, faqs]);


  const handleSave = async () => {
    if (!formData.question || !formData.answer_html) { alert("질문과 답변을 모두 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const sendData = new FormData();
    sendData.append("question", formData.question);
    sendData.append("answer_html", formData.answer_html);
    appendFiles(sendData, files);

    try {
      const config = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } };
      if (isEditMode) {
        await axios.put(`${API_BASE}/faqs/${targetId}`, sendData, config);
        alert("수정되었습니다.");
      } else {
        await axios.post(`${API_BASE}/faqs`, sendData, config);
        alert("등록되었습니다.");
      }
      setShowModal(false);
      fetchFaqs();
    } catch (error) { alert(errorMessage(error, "저장 실패")); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`${API_BASE}/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchFaqs();
      } catch (error) { alert("삭제 실패"); }
    }
  };

  const handleOpenCreate = () => { setIsEditMode(false); setFormData({ question: "", answer_html: "" }); setFiles([]); setShowModal(true); };
  const handleOpenEdit = (item) => { setIsEditMode(true); setTargetId(item.id); setFormData({ question: item.question, answer_html: item.answer_html }); setFiles([]); setShowModal(true); };

  return (
    <>
        <div style={styles.pageTitle}>FAQ 관리</div>
        
        {/* 필터 및 검색 바 */}
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="all">전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="year">올해</option>
                </select>
                <div style={styles.searchWrapper}>
                    <MdSearch size={16} color="#666" />
                    <input
                        type="text"
                        placeholder="질문 또는 답변 검색..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} style={{...styles.createBtn, display: 'flex', alignItems: 'center', gap: '4px'}} onClick={handleOpenCreate}><MdAdd size={16} /> 등록</motion.button>
        </div>

        <div style={styles.listArea}>
            {filteredFaqs.length === 0 ? (
                <div style={styles.emptyMessage}>
                    {searchTerm || dateFilter !== 'all' ? "검색 조건에 맞는 FAQ가 없습니다." : "등록된 FAQ가 없습니다."}
                </div>
            ) : (
                filteredFaqs.map((item) => (
                    <motion.div
                      key={item.id}
                      style={styles.card}
                      onClick={() => setDetail(item)}
                      whileHover={{ y: -2, boxShadow: '0 6px 12px rgba(0,0,0,0.1)' }}
                      whileTap={{ scale: 0.995 }}
                    >
                        <div style={styles.cardContent}>
                            <div style={styles.question}>
                              <span style={{color:'#003675', marginRight:'5px'}}>Q.</span>{item.question}
                              {attachmentsOf(item, 'faq', API_BASE).length > 0 && <MdAttachFile size={13} style={{marginLeft: '5px', verticalAlign: 'middle'}} />}
                            </div>
                            <div style={styles.answer}>
                              <span style={{color:'#666', marginRight:'5px', fontWeight:'bold'}}>A.</span>{item.answer_html}
                            </div>
                        </div>
                        {/* 수정·삭제는 상세 모달로 옮기고, 그 자리에 등록/수정 날짜를 둔다 */}
                        <div style={styles.dateColumn}>
                            <div style={styles.dateRow}>
                              <span style={styles.dateLabel}>등록</span>
                              <span style={styles.dateValue}>{formatDate(item.created_at) || item.posted_date}</span>
                            </div>
                            {item.updated_at && (
                              <div style={styles.dateRow}>
                                <span style={styles.dateLabel}>수정</span>
                                <span style={styles.dateValue}>{formatDate(item.updated_at)}</span>
                              </div>
                            )}
                        </div>
                    </motion.div>
                ))
            )}
        </div>

      {/* 상세 보기 — 카드를 누르면 전체 내용과 수정·삭제 */}
      <AnimatedModal isOpen={!!detail} onClose={() => setDetail(null)} overlayStyle={m.overlay} modalStyle={m.modal}>
            {(() => { const d = detail || {}; return (
            <>
            <div style={m.header}>
              <div style={m.headerTop}>
                <div style={{minWidth: 0}}>
                  <div style={m.kicker}>자주 묻는 질문</div>
                  <h3 style={m.headerTitle}>{d.question}</h3>
                </div>
                <button onClick={() => setDetail(null)} style={m.closeBtn}><MdClose size={18} /></button>
              </div>
              <div style={m.metaRow}>
                {d.category && <span style={m.chipAccent}>{d.category}</span>}
              </div>
            </div>
            <div style={m.content}>
              {/* 넓은 모달에서 답변만 위에 붙고 아래가 비는 걸 막기 위해 좌우로 나눔 */}
              <div style={m.splitRow}>
                <div style={m.splitMain}>
                  <div style={m.sectionHead}>답변<span style={m.sectionLine} /></div>
                  <div style={m.bodyFill}>{linkify(d.answer_html)}</div>
                </div>

                <div style={m.splitSide}>
                  <div>
                    <div style={m.sectionHead}>정보<span style={m.sectionLine} /></div>
                    <div style={m.infoList}>
                      {d.category && (
                        <div style={m.infoItem}>
                          <span style={m.infoLabel}>분류</span>
                          <span style={m.infoValue}>{d.category}</span>
                        </div>
                      )}
                      <div style={m.infoItem}>
                        <span style={m.infoLabel}>등록</span>
                        <span style={m.infoValue}>{formatDate(d.created_at) || d.posted_date}</span>
                      </div>
                      {d.updated_at && (
                        <div style={m.infoItem}>
                          <span style={m.infoLabel}>수정</span>
                          <span style={m.infoValue}>{formatDate(d.updated_at)}</span>
                        </div>
                      )}
                      <div style={m.infoItem}>
                        <span style={m.infoLabel}>첨부</span>
                        {attachmentsOf(d, 'faq', API_BASE).length > 0 ? (
                          attachmentsOf(d, 'faq', API_BASE).map((a, i) => (
                            <div key={i} style={{marginTop: '4px'}}>
                              <AttachmentPreview url={a.url} name={a.name} maxHeight={200} />
                            </div>
                          ))
                        ) : (
                          <span style={{...m.infoValue, color: '#9aa3af', fontWeight: 500}}>없음</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={m.sideActions}>
                    <div style={m.sectionHead}>관리<span style={m.sectionLine} /></div>
                    <motion.button whileTap={{ scale: 0.97 }} style={m.sideEditBtn}
                      onClick={() => { const t = detail; setDetail(null); handleOpenEdit(t); }}>수정</motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} style={m.sideDeleteBtn}
                      onClick={() => { handleDelete(d.id); setDetail(null); }}>삭제</motion.button>
                  </div>
                </div>
              </div>
            </div>
            </>
            ); })()}
      </AnimatedModal>

      {/* 등록 / 수정 */}
      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} overlayStyle={m.overlay} modalStyle={m.modal}>
            <div style={m.header}>
              <div style={m.headerTop}>
                <div style={{minWidth: 0}}>
                  <div style={m.kicker}>자주 묻는 질문</div>
                  <h3 style={m.headerTitle}>{isEditMode ? "질문 수정" : "새 질문 등록"}</h3>
                </div>
                <button onClick={() => setShowModal(false)} style={m.closeBtn}><MdClose size={18} /></button>
              </div>
            </div>
            <div style={m.content}>
              <div style={m.splitRow}>
                {/* 왼쪽: 질문 + 답변(남는 높이를 채움) */}
                <div style={m.splitMain}>
                  <div style={m.sectionHead}>질문<span style={m.sectionLine} /></div>
                  <input type="text" style={styles.modalInput} placeholder="질문 내용을 입력하세요"
                    value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})}/>

                  <div style={{...m.sectionHead, marginTop: '20px'}}>답변<span style={m.sectionLine} /></div>
                  <textarea style={{...m.textarea, flex: 1, minHeight: '200px'}} placeholder="답변 내용을 입력하세요."
                    value={formData.answer_html} onChange={(e) => setFormData({...formData, answer_html: e.target.value})}/>
                  <div style={m.charCount}>{formData.answer_html.length}자</div>
                </div>

                {/* 오른쪽: 첨부 · 저장 */}
                <div style={m.splitSide}>
                  <div>
                    <div style={m.sectionHead}>첨부파일<span style={m.sectionLine} /></div>
                    <FilePicker files={files} onChange={setFiles} style={m.attachBtn} activeStyle={m.attachBtnActive} label="파일 선택" fullWidth />
                  </div>

                  <div style={m.sideActions}>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} style={m.submitBtn} onClick={handleSave}>
                      {isEditMode ? "수정 완료" : "등록하기"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
      </AnimatedModal>
    </>
  );
}

const styles = {
  dateColumn: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                flexShrink: 0, marginLeft: '16px', gap: '4px' },
  // 라벨과 날짜를 한 줄로 묶어야 어느 라벨의 날짜인지 바로 읽힌다
  dateRow: { display: 'flex', alignItems: 'baseline', gap: '8px', whiteSpace: 'nowrap' },
  dateLabel: { fontSize: '12px', fontWeight: 800, color: '#6b7280' },
  dateValue: { fontSize: '15px', fontWeight: 700, color: '#1f2937' },
  modalInput: { width: '100%', padding: '12px 14px', border: '1px solid #e5e8ec', borderRadius: '10px',
                fontSize: '14.5px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '20px' },
  
  // 필터 바 (통일된 디자인)
  filterBar: { marginBottom:'15px', padding:'10px 15px', backgroundColor:'#f8f9fa', borderRadius:'12px', border:'1px solid #e9ecef', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' },
  filterGroup: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor:'white', fontSize:'14px', cursor:'pointer', outline:'none', minWidth:'120px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ced4da', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', minWidth: '250px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', backgroundColor: 'transparent' },
  createBtn: { padding: '10px 20px', backgroundColor: '#003675', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },

  listArea: { flex: 1, overflowY: 'auto', padding: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#868e96', fontWeight: '500' },
  
  // 카드 (흰색 + 테두리 + 그림자)
  card: { cursor: 'pointer', backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid #dee2e6', transition: 'all 0.2s ease' },
  cardContent: { flex: 1, minWidth: 0 },
  question: { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#333' },
  answer: { fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.5' },
  fileIcon: { fontSize: '14px' },
  
  actionButtons: { display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '5px', flexShrink: 0 },
  editBtn: { padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#003675', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight:'bold' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight:'bold' },
};

export default TAFaqManage;