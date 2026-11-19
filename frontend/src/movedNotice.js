// 학과 서버(sch-cse-task.com)로 옮기기 전의 옛 주소(Render, *.onrender.com)로 들어온 사람에게
// "주소가 바뀌었다"는 안내를 보여 주고 새 주소로 보낸다.
//
// 옛 주소로 설치된 홈 화면 앱(PWA)은 새 배포본이 올라오면 서비스워커가 스스로 교체되고
// 페이지를 새로고침하므로(sw.js), 이 안내가 옛 앱 사용자에게도 전달된다.
// 옛 주소의 서비스워커와 캐시는 지워서, 다음에 열어도 옛 화면이 캐시에서 다시 뜨지 않게 한다.

export const NEW_HOME = 'https://sch-cse-task.com/';

export function isOldHost() {
  return window.location.hostname.endsWith('.onrender.com');
}

export function showMovedNotice() {
  document.title = '주소가 바뀌었습니다 - 행정조교 시스템';
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;
                background:#f3f6fb;font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;box-sizing:border-box">
      <div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:28px 24px;
                  box-shadow:0 4px 24px rgba(0,54,117,.12);text-align:center;color:#1a1a1a">
        <div style="font-size:20px;font-weight:700;color:#003675;margin-bottom:12px">행정조교 시스템 주소가 바뀌었습니다</div>
        <div style="font-size:15px;line-height:1.6;margin-bottom:20px">
          새 주소: <b>sch-cse-task.com</b><br>
          잠시 후 새 주소로 이동합니다. 다시 로그인해 주세요.
        </div>
        <a href="${NEW_HOME}" style="display:block;background:#003675;color:#fff;text-decoration:none;
           padding:14px;border-radius:10px;font-size:16px;font-weight:600;margin-bottom:16px">새 주소로 이동</a>
        <div style="font-size:13px;color:#555;line-height:1.6;text-align:left">
          · 홈 화면에 앱을 설치해 두었다면, 새 주소에서 다시 설치해 주세요.<br>
          · 알림을 받고 있었다면 새 주소의 마이페이지에서 <b>알림 받기</b>를 다시 켜 주세요.
        </div>
      </div>
    </div>`;

  const cleanup = Promise.allSettled([
    navigator.serviceWorker?.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))),
    window.caches?.keys().then((ks) => Promise.all(ks.map((k) => window.caches.delete(k)))),
  ]);
  cleanup.finally(() => setTimeout(() => window.location.replace(NEW_HOME), 5000));
}
