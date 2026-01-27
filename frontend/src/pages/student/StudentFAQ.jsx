// src/pages/student/StudentFaq.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg';

function StudentFaq() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  
  // 검색어 상태
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await axios.get('http://13.219.208.109:8000/faqs');
        setFaqs(response.data);
      } catch (error) {
        console.error("FAQ 로딩 실패:", error);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFaq = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 검색 필터링 로직
  const filteredFaqs = faqs.filter((item) => {
    const searchLower = keyword.toLowerCase();
    const questionMatch = item.question.toLowerCase().includes(searchLower);
    const answerMatch = item.answer_html.toLowerCase().includes(searchLower);
    return questionMatch || answerMatch;
  });

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

        <h2 style={{margin: 0, fontSize: 'clamp(20px, 5vw, 24px)', color: 'white', fontWeight: '500'}}>자주 묻는 질문</h2>
        
        <div style={{width: '60px'}}></div>
      </div>

      {/* 유리 박스 컨테이너 */}
      <div style={styles.glassContainer}>
        
        {/* 검색창 영역 */}
        <div style={styles.searchWrapper}>
          <div style={styles.searchBox}>
            <span style={{fontSize:'18px', marginRight:'10px'}}>🔍</span>
            <input 
              style={styles.searchInput}
              placeholder="검색어 입력 (예: 휴학)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* 목록 영역 */}
        <div style={styles.listArea}>
          {filteredFaqs.length === 0 ? (
            <div style={styles.emptyMessage}>
              {keyword ? `"${keyword}" 검색 결과 없음` : "등록된 질문이 없습니다."}
            </div>
          ) : (
            filteredFaqs.map((item) => (
              <div 
                key={item.id} 
                style={expandedId === item.id ? styles.cardExpanded : styles.card}
              >
                {/* 질문 */}
                <div style={styles.questionRow} onClick={() => toggleFaq(item.id)}>
                  <span style={styles.qMark}>Q.</span>
                  <span style={styles.qText}>{item.question}</span>
                  <span style={styles.arrow}>{expandedId === item.id ? '▲' : '▼'}</span>
                </div>
                
                {/* 답변 */}
                {expandedId === item.id && (
                  <div style={styles.answerRow}>
                    <div style={styles.answerContent}>
                      <span style={styles.aMark}>A.</span>
                      <div style={{flex: 1, minWidth: 0}}> {/* minWidth:0 은 텍스트 넘침 방지용 */}
                          <div style={styles.aText}>{item.answer_html}</div>
                          
                          {/* 파일 다운로드 */}
                          {item.file_path && (
                            <div style={styles.fileBox}>
                              <a 
                                href={`http://13.219.208.109:8000/uploads/faqs/${item.file_path}`} 
                                download={item.original_filename}
                                style={styles.downloadLink}
                              >
                                💾 {item.original_filename}
                              </a>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
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

  searchWrapper: {
    marginBottom: '15px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    padding: '10px 12px', // 패딩 약간 줄임
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.1)'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '16px', // 모바일 input 확대 방지 (16px 이상)
    flex: 1,
    backgroundColor: 'transparent',
    fontWeight: '500',
    color: '#333'
  },

  listArea: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '2px'
  },
  
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },
  
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: '12px', 
    marginBottom: '10px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    overflow: 'hidden',
    border: '1px solid transparent',
    transition: 'all 0.2s'
  },
  cardExpanded: {
    backgroundColor: 'white', 
    borderRadius: '12px', 
    marginBottom: '10px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
    overflow: 'hidden',
    border: '2px solid #003675',
    transform: 'scale(1.01)',
    transition: 'all 0.2s'
  },
  
  questionRow: { 
    padding: '15px', // 패딩 최적화
    display: 'flex', 
    alignItems: 'center', 
    cursor: 'pointer', 
    backgroundColor: 'transparent' 
  },
  qMark: { 
    color: '#003675', 
    fontWeight: '900', 
    marginRight: '10px', 
    fontSize: '18px',
    flexShrink: 0 // 화면 줄어도 Q 마크 안 찌그러지게
  },
  qText: { 
    flex: 1, 
    fontWeight: '700', 
    fontSize: '15px', 
    color: '#333',
    lineHeight: '1.4',
    wordBreak: 'keep-all' // 단어 단위 줄바꿈
  },
  arrow: { color: '#999', fontSize: '12px', marginLeft: '8px' },
  
  answerRow: { 
    padding: '15px', 
    backgroundColor: '#f8f9fa', 
    borderTop: '1px solid #eee' 
  },
  answerContent: { display: 'flex', gap: '10px' },
  aMark: { 
    color: '#ef6c00', 
    fontWeight: '900', 
    fontSize: '18px', 
    marginTop: '-2px',
    flexShrink: 0 // A 마크 고정
  },
  aText: { 
    fontSize: '15px', 
    lineHeight: '1.6', 
    color: '#444', 
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word' // 긴 텍스트 줄바꿈
  },
  
  fileBox: { 
    marginTop: '12px', 
    paddingTop: '12px', 
    borderTop: '1px dashed #ccc',
    display: 'flex',
    alignItems: 'center'
  },
  downloadLink: { 
    fontSize: '13px', 
    color: '#003675', 
    fontWeight: 'bold', 
    textDecoration: 'none', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    backgroundColor: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    // 긴 파일명 처리
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%'
  }
};

export default StudentFaq;