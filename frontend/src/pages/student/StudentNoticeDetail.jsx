// src/pages/student/StudentNoticeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { MdChevronLeft, MdFileDownload, MdLogout, MdHome, MdPerson } from 'react-icons/md';
import { motion } from 'framer-motion';
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

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
           <MdChevronLeft size={20} /> 뒤로가기
        </button>
        <h2 style={styles.headerTitle}>공지 상세</h2>
      </div>

      <div style={styles.scrollArea}>
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
                <MdFileDownload size={24} color="#003675" />
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
          {source === 'external' ? (
            // 학과 홈페이지 크롤링 공지는 실제 HTML 서식(줄바꿈 등)이 있어서
            // 안전하게 정화(sanitize)한 뒤 HTML로 렌더링
            <div
               className="notice-content"
               style={{
                   minHeight: '200px',
                   wordBreak: 'break-word',
                   overflowX: 'auto',
                   textAlign: 'justify',
                   letterSpacing: '-0.3px'
               }}
               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content_html) }}
            />
          ) : (
            // 조교가 직접 입력하는 내부 공지는 일반 텍스트라 그대로 표시 (XSS 방지)
            <div
               className="notice-content"
               style={{
                   whiteSpace: 'pre-wrap',
                   minHeight: '200px',
                   wordBreak: 'break-word',
                   overflowX: 'auto',
                   textAlign: 'justify',
                   letterSpacing: '-0.3px'
               }}
            >
              {notice.content_html}
            </div>
          )}
        </div>

      </div>
      </div>

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
    whiteSpace: 'nowrap',
    position: 'relative',
    zIndex: 1
  },
  // 뒤로가기 버튼 폭과 무관하게 항상 정중앙에 오도록 절대 위치로 배치
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: 0,
    textAlign: 'center',
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: '600',
    color: 'white',
    pointerEvents: 'none'
  },
  // 헤더와 하단 네비게이션 사이 공간을 채우고, 내용이 길면 이 영역만 스크롤
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    flexDirection: 'column'
  },
  glassContainer: {
    flex: 1,
    width: 'calc(100% - 30px)',
    maxWidth: '820px',
    boxSizing: 'border-box',
    margin: '15px auto',
    padding: 'clamp(20px, 4vw, 30px)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // 가독성을 위해 배경 불투명도 약간 상승
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column'
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
  // 아이콘마다 시각적 크기/여백이 조금씩 달라 보이는 것을 방지하기 위해
  // 항상 같은 크기의 박스 정중앙에 아이콘을 배치
  navIconWrap: {
    width: '27px',
    height: '27px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default StudentNoticeDetail;