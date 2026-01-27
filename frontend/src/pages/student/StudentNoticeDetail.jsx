// src/pages/student/StudentNoticeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg'; 

function StudentNoticeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source'); 
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`http://13.219.208.109:8000/notices/internal/${id}`);
        setNotice(response.data);
      } catch (error) {
        console.error("상세 정보 로딩 실패:", error);
        alert("공지사항을 불러올 수 없습니다.");
        navigate(-1);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (!notice) {
    return (
        <div style={{...styles.pageContainer, justifyContent:'center', color: 'white', fontSize:'20px'}}>
            로딩중...
        </div>
    );
  }

  const getFileUrl = () => {
    if (!notice.file_path) return "";
    if (source === 'external') {
      return `http://13.219.208.109:8000/uploads/external_notices/${notice.file_path}`;
    }
    return `http://13.219.208.109:8000/uploads/notices/${notice.file_path}`;
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate(-1)}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>
        
        <h2 style={{margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '600', color: 'white'}}>공지 상세</h2>
        
        <div style={{width: '60px'}}></div> 
      </div>

      {/* 상세 내용 유리 박스 - 내부 스크롤을 위해 div 하나 더 감싸거나 스타일 수정 */}
      <div style={styles.glassContainer}>
        
        {/* 제목 영역 */}
        <div style={styles.titleSection}>
          <div style={styles.badgeWrapper}>
              <span style={styles.badge}>
                {notice.target_grade === 0 ? '전체' : `${notice.target_grade}학년`}
              </span>
              {source === 'external' && <span style={styles.extBadge}>학과홈페이지</span>}
          </div>
          <h1 style={styles.title}>{notice.title}</h1>
          <div style={styles.date}>작성일: {notice.posted_date}</div>
        </div>

        {/* 파일 다운로드 영역 */}
        {notice.file_path && (
          <div style={styles.fileCard}>
            <div style={styles.fileInfo}>
                <span style={{fontSize:'24px'}}>💾</span>
                <div style={{minWidth: 0}}>
                    <div style={{fontSize:'12px', color:'#666', marginBottom:'2px'}}>첨부파일</div>
                    <a 
                      href={getFileUrl()} 
                      download={notice.original_filename} 
                      style={styles.downloadLink}
                    >
                      {notice.original_filename}
                    </a>
                </div>
            </div>
            <a 
              href={getFileUrl()} 
              download={notice.original_filename} 
              style={styles.downloadBtn}
            >
              다운로드
            </a>
          </div>
        )}

        {/* 본문 내용 */}
        <div style={styles.bodySection}>
          <div 
             className="notice-content"
             style={{
                 whiteSpace: 'pre-wrap', 
                 minHeight: '200px', 
                 wordBreak: 'break-word',
                 overflowX: 'auto'
             }} 
             dangerouslySetInnerHTML={{ __html: notice.content_html }} 
          />
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
    overflowY: 'auto', // 페이지 전체 스크롤 활성화
    WebkitOverflowScrolling: 'touch'
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
    // flex: 1 대신 flex-shrink: 0을 주어 내용만큼 늘어나게 함
    flexShrink: 0,
    margin: '15px',
    padding: 'clamp(20px, 4vw, 30px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    // 내부 스크롤이 아닌 페이지 스크롤을 이용하기 위해 overflow 제거
    marginBottom: '40px' 
  },

  titleSection: {
    borderBottom: '2px solid rgba(0, 54, 117, 0.1)',
    paddingBottom: '15px',
    marginBottom: '20px'
  },
  badgeWrapper: { display: 'flex', gap: '8px', marginBottom: '10px' },
  badge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#003675', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  extBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#ef6c00', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  
  title: { 
    fontSize: 'clamp(18px, 5vw, 24px)', 
    fontWeight: '800', 
    color: '#1a1a1a', 
    marginBottom: '10px', 
    lineHeight: '1.4',
    wordBreak: 'keep-all'
  },
  date: { fontSize: '13px', color: '#666', textAlign: 'right' },

  fileCard: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  fileInfo: {
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px',
    flex: 1,
    minWidth: '150px'
  },
  downloadLink: { 
    textDecoration: 'none', 
    color: '#333', 
    fontWeight: 'bold', 
    fontSize: '13px',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px' // 모바일에서 파일명이 너무 길면 잘리도록 조절
  },
  downloadBtn: {
    backgroundColor: 'white',
    color: '#003675',
    padding: '6px 10px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid #003675',
    whiteSpace: 'nowrap'
  },

  bodySection: { 
    fontSize: '16px', 
    lineHeight: '1.6', 
    color: '#333',
    padding: '0 5px',
    maxWidth: '100%',
    // 본문 내부에 매우 긴 단어나 코드가 있을 경우를 대비
    overflowX: 'auto' 
  }
};

export default StudentNoticeDetail;