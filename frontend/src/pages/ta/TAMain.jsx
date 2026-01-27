// src/pages/ta/TAMain.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TAMain() {
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 후 첫 페이지를 '대기중인 문의'로 설정
    navigate('/ta/pending', { replace: true });
  }, [navigate]);

  return null; // 화면을 그리지 않고 이동
}

export default TAMain;