// 권한별 첫 화면. 로그인·세션복원·비밀번호 변경 세 군데가 같은 규칙을 써야 해서 한 곳에 모았다.
// 개발자(admin)는 조교 화면이 아니라 개발자 도구로 보낸다
// (개발자 도구 안에 조교 화면으로 넘어가는 버튼을 따로 두었다).
export function landingPath(role) {
  if (role === 'admin') return '/dev';
  if (role === 'assistant') return '/ta/main';
  return '/student/main';
}
