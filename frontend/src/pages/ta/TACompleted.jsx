// src/pages/ta/TACompleted.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TALayout from './TALayout';
import '../../App.css'; 

function TACompleted() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  
  // 데이터 관련
  const [academicEvents, setAcademicEvents] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // 답변 수정 관련 State
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState(null);

  // 필터 및 검색 State
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => { fetchInquiries(); }, []);

  // 필터링 로직 (검색어, 학년, 날짜 변경 시 자동 실행)
  useEffect(() => {
    let result = [...inquiries];

    // 1. 검색어 필터 (제목 + 학생 이름)
    if (searchTerm) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.author_info && item.author_info.name.includes(searchTerm))
      );
    }

    // 2. 학년 필터
    if (gradeFilter !== "all") {
      result = result.filter(item => 
        item.author_info && item.author_info.grade === parseInt(gradeFilter)
      );
    }

    // 3. 날짜 필터
    if (dateFilter !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(item => {
        const itemDate = new Date(item.created_at);
        const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        if (dateFilter === 'today') {
          return itemDateStart.getTime() === todayStart.getTime();
        }
        if (dateFilter === 'week') {
          const day = now.getDay(); 
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          return itemDate >= monday;
        }
        if (dateFilter === 'month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'year') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    setFilteredInquiries(result);
  }, [searchTerm, gradeFilter, dateFilter, inquiries]);

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await axios.get('http://13.219.208.109:8000/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      const completedList = response.data.filter(item => item.status === 'COMPLETED' || item.status === '답변 완료');
      
      // 학사일정 정보 (모달 표시용)
      const resEvents = await axios.get('http://13.219.208.109:8000/academic-events');
      const eventMap = {};
      resEvents.data.forEach(ev => { eventMap[ev.id] = ev; });
      setAcademicEvents(eventMap);

      const sortedList = completedList.sort((a, b) => b.id - a.id);
      setInquiries(sortedList);
      setFilteredInquiries(sortedList);
    } catch (error) { console.error(error); }
  };

  const handleSelect = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const qRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const rRes = await axios.get(`http://13.219.208.109:8000/inquiries/${id}/replies`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedInquiry({ ...qRes.data, replies: rRes.data });
      setEditingReplyId(null);
    } catch (error) { alert("상세 정보를 불러오지 못했습니다."); }
  };

  const handleUpdateReply = async (inquiryId, replyId) => {
    if (!editContent.trim()) { alert("내용을 입력해주세요."); return; }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("content", editContent);
    if (editFile) formData.append("file", editFile);

    try {
      await axios.put(`http://13.219.208.109:8000/inquiries/${inquiryId}/replies/${replyId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert("수정되었습니다.");
      handleSelect(inquiryId);
    } catch (error) { alert("수정 실패"); }
  };

  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>처리 완료 문의</div>
        
        {/* 필터 및 검색 바 (새로 추가됨) */}
        <div style={styles.filterBar}>
            <div style={styles.filterGroup}>
                <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="all">📅 전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="year">올해</option>
                </select>
                <select style={styles.select} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="all">🎓 전체 학년</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                </select>
            </div>
            <div style={styles.searchWrapper}>
                <span style={{fontSize:'16px'}}>🔍</span>
                <input 
                    type="text" 
                    placeholder="이름 또는 제목 검색..." 
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div style={styles.listArea}>
          {filteredInquiries.length === 0 ? (
            <div style={styles.emptyMessage}>
                {searchTerm || gradeFilter !== 'all' || dateFilter !== 'all' 
                    ? "검색 조건에 맞는 문의가 없습니다." 
                    : "완료된 문의가 없습니다."}
            </div>
          ) : (
            filteredInquiries.map((item) => (
              <div key={item.id} style={styles.card} onClick={() => handleSelect(item.id)}>
                <div style={styles.cardHeader}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={styles.statusDone}>답변 완료</span>
                    {/* 학생 이름 표시 추가 */}
                    {item.author_info && (
                        <span style={styles.nameTag}>
                            {item.author_info.name}
                        </span>
                    )}
                  </div>
                  <span style={styles.date}>{item.created_at.split('T')[0]}</span>
                </div>
                <h3 style={styles.title}>{item.title}</h3>
                
                {/* 목록 카드에 학생 상세 정보 표시 (요청사항 반영) */}
                <div style={styles.writerInfo}>
                    {item.author_info 
                        ? `${item.author_info.department} ${item.author_info.grade}학년 ${item.author_info.name} (${item.author_info.student_no})` 
                        : `ID: ${item.user_id}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 모달 (기존 상세 정보 표시 기능 유지) */}
      {selectedInquiry && (
        <div style={modalStyles.overlay} onClick={() => setSelectedInquiry(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h3 style={{margin:0, color:'#2e7d32'}}>문의 상세</h3>
              <button onClick={() => setSelectedInquiry(null)} style={modalStyles.closeBtn}>✕</button>
            </div>
            
            <div style={modalStyles.content}>
               
               {/* 질문 영역 */}
               <div style={modalStyles.questionBox}>
                  
                  {/* 학생 정보 상세 */}
                  <div style={{fontSize:'14px', color:'#555', marginBottom:'12px', borderBottom:'1px dashed #ddd', paddingBottom:'8px'}}>
                      <span style={{marginRight:'5px'}}>👤</span> 
                      <span style={{fontWeight:'bold'}}>학생 정보: </span>
                      {selectedInquiry.author_info ? (
                          <span>
                              {selectedInquiry.author_info.department} / {selectedInquiry.author_info.grade}학년 / <span style={{fontWeight:'bold', color:'#333'}}>{selectedInquiry.author_info.name}</span> ({selectedInquiry.author_info.student_no})
                          </span>
                      ) : (
                          <span>ID: {selectedInquiry.user_id}</span>
                      )}
                  </div>

                  <div style={modalStyles.qTitle}>Q. {selectedInquiry.title}</div>
                  <div style={modalStyles.qText}>{selectedInquiry.content}</div>
                  
                  {selectedInquiry.attachment && (
                      <div style={{marginTop:'15px', backgroundColor:'white', padding:'8px', borderRadius:'6px', border:'1px solid #eee', display:'inline-block'}}>
                          <a href={`http://13.219.208.109:8000${selectedInquiry.attachment}`} target="_blank" rel="noreferrer" style={modalStyles.fileLink}>📎 학생 첨부파일 보기</a>
                      </div>
                  )}

                  {/* 관련 학사일정 */}
                  {selectedInquiry.academic_event_id && academicEvents[selectedInquiry.academic_event_id] && (
                      <div style={{marginTop:'15px', padding:'10px', backgroundColor:'#e8f5e9', borderRadius:'8px', color:'#2e7d32', fontSize:'14px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'6px'}}>
                          <span>📅</span>
                          <span>관련 일정: {academicEvents[selectedInquiry.academic_event_id].title} (~{academicEvents[selectedInquiry.academic_event_id].end_date})</span>
                      </div>
                  )}
               </div>

               <hr style={{margin:'25px 0', border:'0', borderTop:'1px dashed #ddd'}}/>
               
               {/* 답변 영역 */}
               <div style={modalStyles.section}>
                  <div style={{fontSize:'16px', fontWeight:'bold', color:'#2e7d32', marginBottom:'10px'}}>A. 답변 내역</div>
                  {selectedInquiry.replies?.map(r => (
                    <div key={r.id} style={modalStyles.answerBox}>
                        {editingReplyId === r.id ? (
                            <div>
                                <textarea style={modalStyles.editTextarea} value={editContent} onChange={(e)=>setEditContent(e.target.value)}/>
                                <div style={{marginTop:'8px', display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                                    <button onClick={()=>{setEditingReplyId(null)}} style={modalStyles.cancelBtn}>취소</button>
                                    <button onClick={()=>handleUpdateReply(selectedInquiry.id, r.id)} style={modalStyles.saveBtn}>저장</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{whiteSpace:'pre-wrap', lineHeight:'1.5', color:'#333'}}>{r.content}</div>
                                {r.attachment && (
                                    <div style={{marginTop:'8px'}}>
                                        <a href={`http://13.219.208.109:8000${r.attachment}`} target="_blank" rel="noreferrer" style={{fontSize:'13px', color:'#2e7d32', fontWeight:'bold', textDecoration:'none'}}>📎 답변 첨부파일</a>
                                    </div>
                                )}
                                <div style={{marginTop:'10px', textAlign:'right'}}>
                                    <button onClick={()=>{setEditingReplyId(r.id); setEditContent(r.content);}} style={{fontSize:'12px', border:'none', background:'none', color:'#666', cursor:'pointer', textDecoration:'underline'}}>✏️ 수정하기</button>
                                </div>
                            </div>
                        )}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </TALayout>
  );
}

const styles = {
  glassBox: { backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', borderRadius: '20px', padding: '30px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px' },
  
  // 필터 바 스타일
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
  filterGroup: { display: 'flex', gap: '8px' },
  select: { padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: 'white', fontSize: '14px', cursor: 'pointer', color: '#555', outline: 'none' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '25px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: '250px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', backgroundColor: 'transparent' },

  listArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#666' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: '5px solid #4caf50' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems:'center' },
  statusDone: { color: '#2e7d32', fontWeight: 'bold', fontSize: '12px', backgroundColor:'#e8f5e9', padding:'2px 6px', borderRadius:'4px' },
  nameTag: { fontSize: '13px', fontWeight: 'bold', color: '#333' },
  date: { color: '#999', fontSize: '12px' },
  title: { fontSize: '16px', fontWeight: 'bold', color:'#333', marginBottom:'6px' },
  writerInfo: { fontSize: '13px', color: '#555', backgroundColor: '#f5f5f5', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { width: '90%', maxWidth: '650px', maxHeight: '85%', backgroundColor: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  content: { padding: '25px', overflowY: 'auto', flex: 1 },
  
  questionBox: { padding: '20px', backgroundColor: '#fff8e1', borderRadius: '12px', border:'1px solid #ffe0b2' },
  qTitle: { fontWeight: 'bold', fontSize: '18px', color:'#333', marginBottom:'10px' },
  qText: { fontSize: '16px', lineHeight: '1.6', color: '#444', whiteSpace: 'pre-wrap' },
  fileLink: { color:'#003675', fontWeight:'bold', textDecoration:'none', fontSize:'14px' },

  section: { marginBottom: '15px' },
  answerBox: { backgroundColor: '#f1f8e9', padding: '20px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #c5e1a5' },
  editTextarea: { width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #a5d6a7', boxSizing: 'border-box', fontSize:'15px' },
  saveBtn: { padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' },
  cancelBtn: { padding: '8px 16px', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' }
};

export default TACompleted;