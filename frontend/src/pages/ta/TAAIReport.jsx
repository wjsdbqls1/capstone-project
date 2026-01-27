// src/pages/ta/TAAIReport.jsx
import React from 'react';
import TALayout from './TALayout';
import '../../App.css';

function TAAIReport() {
  return (
    <TALayout>
      <div style={styles.glassBox}>
        <div style={styles.pageTitle}>AI 조교 리포트</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#666' }}>
            <span style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</span>
            <h3>AI 리포트 기능 준비 중입니다.</h3>
            <p>학생들의 문의 데이터를 분석하여 통계를 보여줄 예정입니다.</p>
        </div>
      </div>
    </TALayout>
  );
}

const styles = {
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '30px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#003675',
    marginBottom: '20px'
  }
};

export default TAAIReport;