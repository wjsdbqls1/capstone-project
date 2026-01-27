// src/pages/ta/TAAIReport.jsx
import React from 'react';
import TALayout from './TALayout';

function TAAIReport() {
  return (
    <TALayout>
        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#003675', marginBottom: '20px'}}>AI 조교 리포트</div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#666'}}>
            <span style={{fontSize: '48px', marginBottom: '20px'}}>🤖</span>
            <h3>AI 리포트 기능 준비 중입니다.</h3>
        </div>
    </TALayout>
  );
}
export default TAAIReport;