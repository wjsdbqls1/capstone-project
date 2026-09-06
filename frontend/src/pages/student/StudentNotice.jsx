// src/pages/student/StudentNotice.jsx 수정본
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MdChevronLeft, MdSearch, MdLogout, MdHome, MdPerson } from 'react-icons/md';
import '../../App.css';

// 배경 이미지
import bgImage from '../../assets/로그인 이미지.jpg'; 

function StudentNotice() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [userGrade, setUserGrade] = useState(null); 
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // 필터 및 검색
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('all'); 

  useEffect(() => {
    const fetchUserGrade = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate('/');
        return;
      }
      try {
        const response = await axios.get('https://capstone-project-of74.onrender.com/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserGrade(response.data.grade); 
      } catch (error) {
        console.error("내 정보 로딩 실패:", error);
        if (error.response && error.response.status === 401) {
           localStorage.clear();
           navigate('/');
        }
      }
    };

    const fetchNotices = async () => {
      try {
        const response = await axios.get('https://capstone-project-of74.onrender.com/notices?source=all&limit=1000');
        setNotices(response.data);
      } catch (error) {
        console.error("공지사항 로딩 실패:", error);
      }
    };

    fetchUserGrade();
    fetchNotices();
  }, [navigate]);

  const handleNoticeClick = (id, source) => {
    navigate(`/student/notice/${id}?source=${source}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setCurrentPage(1);
  };

  const filteredNotices = notices.filter(item => {
    const isVisibleGrade = (item.target_grade === 0) || (userGrade !== null && item.target_grade === userGrade);
    if (!isVisibleGrade) return false;

    if (filterType === 'external') {
        if (item.source !== 'external') return false;
    } 
    else if (filterType === 'internal_common') {
        if (item.source !== 'internal' || item.target_grade !== 0) return false;
    } 
    else if (filterType === 'internal_my') {
        if (item.source !== 'internal' || item.target_grade === 0) return false;
    }

    if (searchKeyword.trim() !== '') {
        if (!item.title.toLowerCase().includes(searchKeyword.toLowerCase())) {
            return false;
        }
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderBadge = (item) => {
    if (item.source === 'external') {
        return <span style={styles.extBadge}>학과홈페이지</span>;
    }
    if (item.target_grade === 0) {
        return <span style={styles.badgeCommon}>전체</span>;
    }
    return <span style={styles.badgeMyGrade}>{item.target_grade}학년</span>;
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate('/student/main')}
        >
           <MdChevronLeft size={20} /> 뒤로가기
        </button>
        <h2 style={styles.headerTitle}>공지사항</h2>
      </div>

      <div style={styles.glassContainer}>
        <div style={styles.filterBar}>
          <select 
              style={styles.select} 
              value={filterType} 
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          >
              <option value="all">전체</option>
              <option value="external">학과홈페이지</option>
              <option value="internal_common">전체공지</option>
              <option value="internal_my">내 학년</option>
          </select>

          <div style={styles.searchGroup}>
              <input
                  style={styles.searchInput}
                  placeholder="제목 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} style={styles.searchBtn} onClick={handleSearch}><MdSearch size={18} /></motion.button>
          </div>
        </div>

        <div style={styles.listContainer}>
          {currentNotices.length === 0 ? (
            <div style={styles.emptyMessage}>공지사항이 없습니다.</div>
          ) : (
            currentNotices.map((item) => (
              <div 
                key={`${item.source}-${item.id}`} 
                style={styles.card}
                onClick={() => handleNoticeClick(item.id, item.source)}
              >
                <div style={styles.cardHeader}>
                   <div style={{display:'flex', gap: '5px'}}>
                     {renderBadge(item)}
                   </div>
                   <span style={styles.date}>{item.posted_date || '-'}</span>
                </div>
                {/* 줄바꿈 허용을 위해 스타일에 wordBreak와 whiteSpace 수정 */}
                <div style={styles.title}>{item.title}</div>
              </div>
            ))
          )}
        </div>

        {filteredNotices.length > 0 && (
          <div style={styles.paginationContainer}>
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{...styles.pageBtn, visibility: currentPage === 1 ? 'hidden' : 'visible'}}
            >
              &lt;
            </button>
            <span style={{fontSize: '16px', fontWeight: 'bold', color: '#333'}}>
                {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              style={{...styles.pageBtn, visibility: currentPage === totalPages ? 'hidden' : 'visible'}}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <nav style={styles.bottomNav}>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={handleLogout}>
          <MdLogout size={18} /> 로그아웃
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/main')}>
          <MdHome size={18} /> 홈
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} style={styles.navBtn} onClick={() => navigate('/student/mypage')}>
          <MdPerson size={18} /> 마이페이지
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
    height: '100dvh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: 'rgba(0, 54, 117, 0.9)',
    padding: '10px 15px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    color: 'white',
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
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: '600',
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
    outline: 'none',
    whiteSpace: 'nowrap'
  },
  glassContainer: {
    flex: 1,
    margin: '15px',
    padding: 'clamp(15px, 3vw, 30px)', 
    backgroundColor: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  filterBar: {
    padding: '10px 0',
    marginBottom: '10px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  select: {
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '15px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#333',
    flexGrow: 1,
    minWidth: '120px'
  },
  searchGroup: {
    display: 'flex',
    gap: '5px',
    flex: 2,
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    minWidth: '200px'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '5px 10px',
    fontSize: '15px',
    backgroundColor: 'transparent',
    minWidth: '0'
  },
  searchBtn: {
    backgroundColor: '#003675',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    width: '35px',
    height: '35px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  },
  listContainer: {
    flex: 1,
    padding: '5px',
    overflowY: 'auto',
  },
  emptyMessage: { textAlign: 'center', marginTop: '50px', color: '#555', fontWeight: 'bold' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    borderLeft: '5px solid #003675'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems:'center' },
  date: { fontSize: '13px', color: '#888' },
  badgeCommon: { fontSize: '12px', backgroundColor: '#546e7a', color: 'white', padding: '3px 6px', borderRadius: '5px', fontWeight: 'bold' },
  badgeMyGrade: { fontSize: '12px', backgroundColor: '#c62828', color: 'white', padding: '3px 6px', borderRadius: '5px', fontWeight: 'bold' },
  extBadge: { fontSize: '12px', backgroundColor: '#ef6c00', color: 'white', padding: '3px 6px', borderRadius: '5px', fontWeight:'bold' },
  
  // ★ 제목 스타일 수정: 줄바꿈 허용
  title: { 
    fontSize: '16px', 
    fontWeight: '600', 
    color: '#333', 
    lineHeight: '1.5',
    whiteSpace: 'normal',    // 'nowrap'에서 'normal'로 변경하여 줄바꿈 허용
    wordBreak: 'keep-all',   // 한글 단어 단위 줄바꿈
    overflow: 'visible',     // 숨김 해제
    display: 'block'         // 블록 요소로 설정
  },
  
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    gap: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  pageBtn: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'white',
    color: '#003675',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  bottomNav: {
    height: '70px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    flexShrink: 0
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    fontSize: 'clamp(12px, 3.2vw, 15px)',
    fontWeight: 'bold',
    color: '#003675',
    cursor: 'pointer',
    padding: '10px'
  }
};

export default StudentNotice;