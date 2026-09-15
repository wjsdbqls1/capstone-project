// 화면을 그리는 도중 예외가 나면 React는 화면 전체를 비워 버린다(흰 화면).
// 그러면 사용자는 무엇이 잘못됐는지 알 수 없고 새로고침 말고는 방법이 없다.
// 여기서 받아서 오류 내용을 보여주고 다시 열 수 있게 한다.
// (같은 종류의 사고가 두 번 있었다: 아이콘 import 누락, 달력 스타일 선언 누락)
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 콘솔에도 남겨 개발자 도구에서 위치를 볼 수 있게
    console.error('[화면 오류]', error, info && info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error);
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.title}>화면을 표시하는 중 문제가 생겼습니다</div>
          <p style={styles.desc}>
            아래 버튼으로 다시 열어 주세요. 계속 반복되면 이 화면을 캡처해서 보내 주시면 바로 확인하겠습니다.
          </p>
          <pre style={styles.err}>{message}</pre>
          <div style={styles.row}>
            <button style={styles.primary} onClick={() => window.location.reload()}>다시 열기</button>
            <button
              style={styles.secondary}
              onClick={() => { window.location.hash = '#/'; window.location.reload(); }}
            >
              처음 화면으로
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  wrap: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', boxSizing: 'border-box', backgroundColor: '#f4f6f9',
    fontFamily: 'inherit',
  },
  card: {
    width: '100%', maxWidth: '420px', backgroundColor: '#fff', borderRadius: '16px',
    padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', boxSizing: 'border-box',
  },
  title: { fontSize: '17px', fontWeight: 800, color: '#003675', marginBottom: '8px' },
  desc: { fontSize: '14px', color: '#5b6572', lineHeight: 1.6, margin: '0 0 12px' },
  err: {
    margin: '0 0 16px', padding: '10px 12px', borderRadius: '8px',
    backgroundColor: '#fff4f4', border: '1px solid #ffcdd2', color: '#b71c1c',
    fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '140px', overflowY: 'auto',
  },
  row: { display: 'flex', gap: '8px' },
  primary: {
    flex: 1, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: '#003675', color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
  },
  secondary: {
    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: '#fff', border: '1px solid #c6ccd5', color: '#374151', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
  },
};

export default ErrorBoundary;
