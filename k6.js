import http from 'k6/http';
import { check, sleep } from 'k6';

// 테스트를 위한 대기열 API 엔드포인트들
const issueUrl = 'http://127.0.0.1:3000/waiting-queue/issue'; // 대기열에 요청을 추가하는 엔드포인트
const checkUrl = 'http://127.0.0.1:3000/waiting-queue/check'; // 대기열 상태를 조회하는 엔드포인트

// 가상 사용자의 수와 테스트 지속 시간을 정의
export let options = {
  vus: 100, // 동시 가상 사용자 수
  duration: '30s', // 테스트 실행 시간
};

export default function () {
  // 대기열에 요청을 추가 (POST)
  let params = { headers: { 'Content-Type': 'application/json' } };
  let res = http.post(issueUrl, undefined, params);

  // 응답 상태 체크 (201번 응답만 성공)
  check(res, {
    '대기열 요청 성공': (r) => r.status === 201,
  });

  // 응답에서 Authorization 헤더에서 Bearer 토큰 추출
  let authHeader = res.headers['Authorization'];
  let token = authHeader ? authHeader : null; // 'Bearer <token>'에서 <token> 부분만 추출

  // 토큰이 존재하면 GET 요청에 Authorization 헤더를 추가
  if (token) {
    let checkParams = {
      headers: {
        authorization: token, // Bearer 토큰 추가
      },
    };

    // 대기열 상태를 조회 (GET)
    res = http.get(checkUrl, checkParams);
    check(res, {
      '대기열 상태 조회 성공': (r) => r.status === 200,
    });
  } else {
    console.error('Authorization token not found!');
  }

  // 일정 시간 대기
  sleep(1); // 1초 대기 후 반복
}
