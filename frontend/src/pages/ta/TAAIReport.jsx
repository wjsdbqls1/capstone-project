// src/pages/ta/TAAIReport.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MdTrendingUp, MdAssignment } from 'react-icons/md';
import TALayout from './TALayout';

const API_BASE = 'https://capstone-project-of74.onrender.com';
const AI_BASE = 'https://wjsdbqls-capstone-ai.hf.space';

function TAAIReport() {
  const [alerts, setAlerts] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    axios.get(`${AI_BASE}/api/ai/forecast`)
      .then(res => setAlerts(res.data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setForecastLoading(false));
  }, []);

  const handleSummarize = async () => {
    if (!startDate || !endDate) { alert('날짜를 선택해주세요.'); return; }
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await axios.post(`${AI_BASE}/api/ai/summarize`, { start_date: startDate, end_date: endDate });
      setSummary(res.data);
    } catch {
      alert('요약 생성에 실패했습니다.');
    }
    setSummaryLoading(false);
  };

  const getRatioLevel = (ratio) => {
    if (ratio >= 2.0) return { label: '급증', color: '#d32f2f', bg: '#ffebee' };
    if (ratio >= 1.5) return { label: '증가', color: '#f57c00', bg: '#fff3e0' };
    return { label: '보통', color: '#388e3c', bg: '#e8f5e9' };
  };

  return (
    <TALayout>
      <div style={styles.pageTitle}>문의 리포트</div>

      {/* 문의량 예측 섹션 */}
      <div style={styles.card}>
        <div style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: '7px'}}><MdTrendingUp size={17} /> 이번 주 문의량 예측</div>
        {forecastLoading ? (
          <div style={styles.loadingText}>분석 중...</div>
        ) : alerts.length > 0 ? (
          <div style={styles.alertList}>
            {alerts.map((item, i) => {
              const level = getRatioLevel(item.increase_ratio);
              return (
                <div key={i} style={{ ...styles.alertItem, backgroundColor: level.bg, border: `1px solid ${level.color}33` }}>
                  <div style={styles.alertHeader}>
                    <span style={{ ...styles.alertBadge, color: level.color }}>{level.label}</span>
                    <span style={styles.alertCategory}>{item.category}</span>
                    <span style={{ ...styles.alertRatio, color: level.color }}>평균 대비 {item.increase_ratio}배</span>
                  </div>
                  <div style={styles.alertMessage}>{item.message}</div>
                  <div style={styles.alertStat}>
                    예상 {item.expected_count}건 · 평균 {item.baseline_avg}건
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyText}>예측 데이터가 없습니다. 문의 데이터가 충분하지 않습니다.</div>
        )}
      </div>

      {/* 기간별 요약 섹션 */}
      <div style={styles.card}>
        <div style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: '7px'}}><MdAssignment size={17} /> 기간별 문의 요약</div>
        <div style={styles.dateRow}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.dateInput} />
          <span style={styles.dateSep}>~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.dateInput} />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} style={styles.summarizeBtn} onClick={handleSummarize} disabled={summaryLoading}>
            {summaryLoading ? '분석 중...' : '요약 생성'}
          </motion.button>
        </div>

        {summaryLoading && <div style={styles.loadingText}>문의 내용을 요약하고 있습니다...</div>}

        <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={styles.summaryResult}>
            <div style={styles.summaryMeta}>
              총 <strong>{summary.total_count}건</strong>의 문의 ({summary.period})
            </div>
            <div style={styles.summaryMessage}>{summary.message}</div>

            {summary.summary && summary.summary.length > 0 && (
              <div style={styles.categoryList}>
                {summary.summary.map((item) => (
                  <div key={item.category} style={styles.categoryItem}>
                    <span style={styles.categoryName}>{item.category}</span>
                    <div style={styles.barWrapper}>
                      <div style={{ ...styles.bar, width: `${Math.min(100, item.ratio * 100)}%` }} />
                    </div>
                    <span style={styles.categoryCount}>{item.count}건</span>
                    <span style={styles.categoryRatio}>({Math.round(item.ratio * 100)}%)</span>
                  </div>
                ))}
              </div>
            )}

            {summary.summary && summary.summary.length > 0 && (
              <div style={styles.representativeSection}>
                <div style={styles.representativeTitle}>카테고리별 대표 문의</div>
                {summary.summary.map((item) => (
                  item.representative && (
                    <div key={item.category} style={styles.representativeItem}>
                      <span style={styles.repCategory}>{item.category}</span>
                      <span style={styles.repText}>{item.representative}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </TALayout>
  );
}

const styles = {
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#003675', marginBottom: '20px' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.9)'
  },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#003675', marginBottom: '15px' },
  loadingText: { color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' },
  emptyText: { color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  alertItem: { padding: '12px 14px', borderRadius: '10px' },
  alertHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  alertBadge: { fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px' },
  alertCategory: { fontSize: '14px', fontWeight: 'bold', color: '#222' },
  alertRatio: { fontSize: '12px', fontWeight: 'bold', marginLeft: 'auto' },
  alertMessage: { fontSize: '13px', color: '#444', marginBottom: '4px' },
  alertStat: { fontSize: '12px', color: '#888' },
  dateRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' },
  dateInput: { padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' },
  dateSep: { color: '#666', fontWeight: 'bold' },
  summarizeBtn: {
    padding: '8px 18px', backgroundColor: '#003675', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
  },
  summaryResult: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '15px' },
  summaryMeta: { fontSize: '14px', color: '#333', marginBottom: '6px' },
  summaryMessage: { fontSize: '13px', color: '#555', marginBottom: '15px', padding: '8px 12px', backgroundColor: '#e3f2fd', borderRadius: '8px' },
  categoryList: { marginBottom: '15px' },
  categoryItem: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  categoryName: { width: '75px', fontSize: '13px', color: '#333', flexShrink: 0 },
  barWrapper: { flex: 1, height: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#003675', borderRadius: '5px', transition: 'width 0.5s ease' },
  categoryCount: { width: '35px', fontSize: '13px', color: '#666', textAlign: 'right', flexShrink: 0 },
  categoryRatio: { width: '40px', fontSize: '12px', color: '#999', flexShrink: 0 },
  representativeSection: { borderTop: '1px solid #dee2e6', paddingTop: '12px' },
  representativeTitle: { fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' },
  representativeItem: { display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' },
  repCategory: { fontSize: '12px', color: '#003675', fontWeight: 'bold', flexShrink: 0, width: '70px' },
  repText: { fontSize: '13px', color: '#444', lineHeight: '1.4' },
};

export default TAAIReport;
