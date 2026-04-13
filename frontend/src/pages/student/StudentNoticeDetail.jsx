// src/pages/student/StudentNoticeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../App.css'; 

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
        const response = await axios.get(`https://capstone-project-of74.onrender.com/notices/internal/${id}`);
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
      return `https://capstone-project-of74.onrender.com/uploads/external_notices/${notice.file_path}`;
    }
    return `https://capstone-project-of74.onrender.com/uploads/notices/${notice.file_path}`;
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* 헤더 */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate(-1)}
        >
           <span style={{fontSize: '18px', marginBottom: '2px'}}>‹</span> 뒤로가기
        </button>
        <h2 style={{margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '600', color: 'white'}}>공지 상세</h2>
        <div style={{width: '60px'}}></div> 
      </div>

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

        {/* 본문 내용 - 가독성 개선 스타일 적용 */}
        <div style={styles.bodySection}>
          <div 
             className="notice-content"
             style={{
                 whiteSpace: 'pre-wrap', 
                 minHeight: '200px', 
                 wordBreak: 'break-word',
                 overflowX: 'auto',
                 textAlign: 'justify', // 양쪽 정렬로 깔끔하게
                 letterSpacing: '-0.3px' // 자간을 살짝 좁혀 응집력 강화
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
    overflowY: 'auto',
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
    flexShrink: 0,
    margin: '15px',
    padding: 'clamp(20px, 4vw, 30px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // 가독성을 위해 배경 불투명도 약간 상승
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '40px' 
  },
  titleSection: {
    borderBottom: '1.5px solid rgba(0, 54, 117, 0.1)',
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
    marginBottom: '12px', 
    lineHeight: '1.35', // 제목 줄간격도 최적화
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
    maxWidth: '180px'
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
    fontSize: '15.5px', // 폰트 크기 미세 조정
    lineHeight: '1.25', // 기존 1.6에서 1.45로 줄여 가독성 강화
    color: '#222', // 글자색을 약간 더 진하게 변경
    padding: '0 2px',
    maxWidth: '100%',
    overflowX: 'auto' 
  }
};

export default StudentNoticeDetail;