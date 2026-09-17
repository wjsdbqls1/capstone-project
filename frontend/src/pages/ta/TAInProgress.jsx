// src/pages/ta/TAInProgress.jsx
// 진행중인 문의 — 조교가 답변했지만 아직 '답변 완료'로 닫지 않은 문의들.
import React from 'react';
import TAInquiryWork from './TAInquiryWork';

function TAInProgress() {
  return <TAInquiryWork mode="in_progress" />;
}

export default TAInProgress;
