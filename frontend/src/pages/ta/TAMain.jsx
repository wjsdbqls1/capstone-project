// src/pages/ta/TAMain.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TALayout from './TALayout';

function TAMain() {
  const navigate = useNavigate();

  // 원하신다면 자동으로 대기 목록으로 이동시킬 수 있습니다.
  // useEffect(() => { navigate('/ta/pending'); }, []);

  return (
    <TALayout>
      <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{fontSize: '40px', marginBottom: '20px'}}>환영합니다! 👋</h1>
        <p style={{fontSize: '18px'}}>왼쪽 메뉴에서 관리할 항목을 선택해주세요.</p>
      </div>
    </TALayout>
  );
}
export default TAMain;