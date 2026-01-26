import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

function TAAIReport() { // PageName 부분을 파일명에 맞게 바꾸세요 (예: StudentInquiry)
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div className="header"><h2>페이지 제목</h2></div>
      <div style={{padding:'20px'}}>준비 중인 페이지입니다.</div>
      <button onClick={() => navigate(-1)} style={{margin:'20px'}}>뒤로 가기</button>
    </div>
  );
}
export default TAAIReport;