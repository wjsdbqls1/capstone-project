// 백엔드 API 주소.
// 서버를 다른 리전으로 옮기거나 주소가 바뀌면 .env.production 한 줄만 고치면 된다.
//
// Vite는 .env를 항상 읽고, 빌드(production) 시에는 .env.production이 우선한다.
// 로컬 개발용 .env에는 localhost가 들어 있으므로, 운영 빌드가 그걸 물고 가지 않도록
// .env.production을 반드시 함께 유지할 것. 값이 없을 때의 기본값도 운영 주소로 둔다.
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://capstone-project-of74.onrender.com';
