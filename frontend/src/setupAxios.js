// 모든 API 요청에 로그인 토큰을 자동으로 붙인다.
// 호출하는 곳마다 헤더를 손으로 넣다 보니 빠뜨린 곳이 많았고,
// 그런 요청은 서버가 로그인을 요구하는 순간 전부 401이 된다.
import axios from 'axios';
import { API_BASE } from './config';

// ★ 우리 백엔드로 나가는 요청에만 붙인다.
// AI 서버(huggingface) 같은 다른 도메인에 토큰을 보내면 그대로 유출된다.
const isOurApi = (url) => typeof url === 'string' && url.startsWith(API_BASE);

axios.interceptors.request.use((config) => {
  if (!isOurApi(config.url)) return config;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    // 직접 헤더를 넣어둔 호출은 그대로 둔다
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 토큰이 만료(7일)되면 화면이 빈 채로 남는 대신 로그인으로 돌려보낸다.
// 로그인 실패의 401은 그 화면에서 직접 안내하므로 건드리지 않는다.
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err?.config?.url;
    if (err?.response?.status === 401 && isOurApi(url) && !url.includes('/auth/login')) {
      localStorage.clear();
      if (window.location.hash !== '#/') {
        window.location.hash = '#/';
      }
    }
    return Promise.reject(err);
  }
);
