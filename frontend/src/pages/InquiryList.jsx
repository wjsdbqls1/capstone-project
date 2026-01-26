// src/pages/InquiryList.jsx
import React, { useState } from 'react';

function InquiryList() {
  // 실제 서버에서 데이터를 가져오기 전, 임시로 사용할 "가짜 데이터(Mock Data)"입니다.
  const [inquiries] = useState([
    { id: 1, type: '학사일정', title: '공결 처리는 언제 완료되나요?', date: '2025.08.15', status: '답변 대기' },
    { id: 2, type: '장학금', title: '포털 사진은 어떻게 변경하나요?', date: '2025.08.05', status: '답변 대기' },
    { id: 3, type: '시설물', title: '강의실 와이파이 비밀번호가...', date: '2025.07.10', status: '답변 완료' },
    { id: 4, type: '성적', title: '성적 처리는 언제 되나요?', date: '2025.07.10', status: '답변 완료' },
  ]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>문의 신청 현황</h2>
      </header>

      <div style={styles.listContainer}>
        {/* 리액트의 핵심! map 함수를 이용해 데이터를 반복해서 화면에 그립니다. */}
        {inquiries.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={item.status === '답변 완료' ? styles.statusDone : styles.statusWaiting}>
                {item.status}
              </span>
              <span style={styles.date}>{item.date}</span>
            </div>
            <h3 style={styles.title}>{item.title}</h3>
          </div>
        ))}
      </div>

      {/* 하단 네비게이션 바 (33페이지 하단 참고) */}
      <nav style={styles.bottomNav}>
        <button style={styles.navButton}>도움말</button>
        <button style={styles.navButton}>홈</button>
        <button style={styles.navButton}>마이페이지</button>
      </nav>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    textAlign: 'center',
    borderBottom: '1px solid #eee',
    color: '#003675',
  },
  listContainer: {
    flex: 1, // 남은 공간을 모두 차지
    padding: '20px',
    overflowY: 'auto', // 내용이 많으면 스크롤
  },
  card: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '12px',
  },
  statusWaiting: {
    color: '#ff9800',
    fontWeight: 'bold',
    border: '1px solid #ff9800',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  statusDone: {
    color: '#4caf50',
    fontWeight: 'bold',
    border: '1px solid #4caf50',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  date: {
    color: '#999',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#333',
  },
  bottomNav: {
    backgroundColor: 'white',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #eee',
  },
  navButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
  }
};

export default InquiryList;