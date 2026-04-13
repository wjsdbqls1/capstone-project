// src/pages/ta/TAAIReport.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TALayout from './TALayout';

const API_BASE = 'https://capstone-project-of74.onrender.com';

function TAAIReport() {
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/ai/forecast`)
      .then(res => setForecast(res.data))
      .catch(() => setForecast(null))
      .finally(() => setForecastLoading(false));

    // 기본 날짜 범위: 지난 30일
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(past.toISOString().split('T')[0]);
  }, []);

  const handleSummarize = async () => {
    if (!startDate || !endDate) { alert('날짜를 선택해주세요.'); return; }
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await axios.post(`${API_BASE}/api/ai/summarize`, { start_date: startDate, end_date: endDate });
      setSummary(res.data);
    } catch {
      alert('요약 생성에 실패했습니다.');
    }
    setSummaryLoading(false);
  };

  const getForecastLevel = (count) => {
    if (count >= 10) return { label: '많음', color: '#d32f2f', bg: '#ffebee' };
    if (count >= 5) return { label: '보통', color: '#f57c00', bg: '#fff3e0' };
    return { label: '적음', color: '#388e3c', bg: '#e8f5e9' };
  };

  return (
    <TALayout>
      <div style={styles.pageTitle}>AI 조교 리포트</div>

      {/* 문의량 예측 섹션 */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>📈 이번 주 문의량 예측</div>
        {forecastLoading ? (
          <div style={styles.loadingText}>분석 중...</div>
        ) : forecast ? (
          <div style={styles.forecastGrid}>
            {(forecast.forecast || []).map((item, i) => {
              const level = getForecastLevel(item.predicted_count);
              return (
                <div key={i} style={{ ...styles.forecastItem, backgroundColor: level.bg, border: `1px solid ${level.color}33` }}>
                  <div style={styles.forecastDate}>{item.date}</div>
                  <div style={{ ...styles.forecastCount, color: level.color }}>{item.predicted_count}건</div>
                  <div style={{ ...styles.forecastLabel, color: level.color }}>{level.label}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyText}>예측 데이터가 없습니다. 문의 데이터가 충분하지 않습니다.</div>
        )}
        {forecast && forecast.alert && (
          <div style={styles.alertBanner}>
            ⚠️ {forecast.alert}
          </div>
        )}
      </div>

      {/* 기간별 요약 섹션 */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>📋 기간별 문의 요약</div>
        <div style={styles.dateRow}>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={styles.dateInput}
          />
          <span style={styles.dateSep}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={styles.dateInput}
          />
          <button style={styles.summarizeBtn} onClick={handleSummarize} disabled={summaryLoading}>
            {summaryLoading ? '분석 중...' : '요약 생성'}
          </button>
        </div>

        {summaryLoading && <div style={styles.loadingText}>AI가 문의 내용을 분석하고 있습니다...</div>}

        {summary && (
          <div style={styles.summaryResult}>
            <div style={styles.summaryMeta}>
              총 <strong>{summary.total_count}건</strong>의 문의 ({startDate} ~ {endDate})
            </div>

            {summary.category_breakdown && (
              <div style={styles.categoryList}>
                {Object.entries(summary.category_breakdown).map(([cat, cnt]) => (
                  <div key={cat} style={styles.categoryItem}>
                    <span style={styles.categoryName}>{cat}</span>
                    <div style={styles.barWrapper}>
                      <div
                        style={{
                          ...styles.bar,
                          width: `${Math.min(100, (cnt / summary.total_count) * 100)}%`
                        }}
                      />
                    </div>
                    <span style={styles.categoryCount}>{cnt}건</span>
                  </div>
                ))}
              </div>
            )}

            {summary.keywords && summary.keywords.length > 0 && (
              <div style={styles.keywordSection}>
                <div style={styles.keywordTitle}>주요 키워드</div>
                <div style={styles.keywordList}>
                  {summary.keywords.map((kw, i) => (
                    <span key={i} style={styles.keywordChip}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {summary.summary_text && (
              <div style={styles.summaryText}>{summary.summary_text}</div>
            )}
          </div>
        )}
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
  forecastGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  forecastItem: { flex: '1 1 80px', minWidth: '80px', padding: '12px 8px', borderRadius: '10px', textAlign: 'center' },
  forecastDate: { fontSize: '11px', color: '#555', marginBottom: '6px' },
  forecastCount: { fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' },
  forecastLabel: { fontSize: '11px', fontWeight: 'bold' },
  alertBanner: {
    marginTop: '15px', padding: '10px 14px',
    backgroundColor: '#fff3e0', border: '1px solid #ffb74d',
    borderRadius: '8px', color: '#e65100', fontSize: '13px', fontWeight: 'bold'
  },
  dateRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' },
  dateInput: { padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' },
  dateSep: { color: '#666', fontWeight: 'bold' },
  summarizeBtn: {
    padding: '8px 18px', backgroundColor: '#003675', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
  },
  summaryResult: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '15px' },
  summaryMeta: { fontSize: '14px', color: '#333', marginBottom: '15px' },
  categoryList: { marginBottom: '15px' },
  categoryItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  categoryName: { width: '80px', fontSize: '13px', color: '#333', flexShrink: 0 },
  barWrapper: { flex: 1, height: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#003675', borderRadius: '5px', transition: 'width 0.5s ease' },
  categoryCount: { width: '40px', fontSize: '13px', color: '#666', textAlign: 'right', flexShrink: 0 },
  keywordSection: { marginBottom: '15px' },
  keywordTitle: { fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' },
  keywordList: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  keywordChip: { backgroundColor: '#e3f2fd', color: '#1565c0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  summaryText: { fontSize: '14px', color: '#444', lineHeight: '1.7', whiteSpace: 'pre-wrap', borderTop: '1px solid #dee2e6', paddingTop: '12px' }
};

export default TAAIReport;
