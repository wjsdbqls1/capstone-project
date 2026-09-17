// src/pages/ta/TAPending.jsx
// 대기중인 문의 — 진행중 화면과 구성이 같아 공통 화면에 mode만 넘긴다.
import React from 'react';
import TAInquiryWork from './TAInquiryWork';

function TAPending() {
  return <TAInquiryWork mode="pending" />;
}

export default TAPending;
