import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// API 엔드포인트 설정
const API_BASE_URL = 'http://127.0.0.1:3000';

const endpoints = {
  issueToken: `${API_BASE_URL}/waiting-queue/issue`,
  checkToken: `${API_BASE_URL}/waiting-queue/check`,
  checkQueueSize: `${API_BASE_URL}/waiting-queue/size`,
  checkConcertBySchedule: `${API_BASE_URL}/concert/schedule/{concertId}`,
  reserveConcert: `${API_BASE_URL}/reservation`,
};

const checkTokenTrend = new Trend('checkToken');

// 가상 사용자 수 및 테스트 지속 시간 설정
export let options = {
  // stages: [{ duration: '3m', target: 7000 }],
  vus: 1500,
  duration: '30s',
};

export default function () {
  // 대기열 토큰 발급 요청
  sleep(Math.random() * 1);
  const token = issueToken();

  // 토큰 발급 성공시 대기열 상태 조회
  if (token) {
    checkQueueStatus(token);
  } else {
    console.error('Authorization token not found!');
  }

  // 추가적인 API 호출은 여기에 구현 가능
  // checkQueueSize();
  // checkConcertInfo();

  sleep(1);
}

// 대기열 토큰 발급 함수
function issueToken() {
  let token;
  const issueTokenParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'issueToken' },
  };

  while (!token) {
    try {
      const res = http.post(endpoints.issueToken, undefined, issueTokenParams);
      check(res, {
        '대기열 요청 성공': (r) => r.status === 201,
      });

      const authHeader = res.headers['Authorization'];
      token = authHeader ? authHeader : null;
    } catch (error) {
      console.log('ISSUE TOKEN ERROR');
    }

    sleep(1); // 대기열 요청을 보낸 후 1초 대기
  }

  return token;
}

// 대기열 상태 조회 함수
function checkQueueStatus(token) {
  const checkParams = {
    headers: {
      authorization: token, // Bearer 토큰 추가
    },
    tags: { name: 'checkToken' },
  };

  let checkTokenRes;

  while (!checkTokenRes) {
    try {
      checkTokenRes = http.get(endpoints.checkToken, checkParams);
      console.log(checkTokenRes.body);

      // 대기 넘버 추출
      const waitingNumber = JSON.parse(checkTokenRes.body)?.waitingNumber;
      if (waitingNumber) {
        checkTokenTrend.add(waitingNumber, { status: 'waitingNumber' });
      }
    } catch (error) {
      console.log('CHECK TOKEN ERROR');
    }

    sleep(1); // 대기열 상태 조회 후 1초 대기
  }

  check(checkTokenRes, {
    '대기열 상태 조회 성공': (r) => r.status === 200,
  });
}

// 대기열 크기 조회 함수 (필요시 활성화 가능)
// function checkQueueSize() {
//   const res = http.get(endpoints.checkQueueSize, { tags: { name: 'checkQueueSize' } });
//   console.log(res.body);
// }

// 콘서트 정보 조회 함수 (필요시 활성화 가능)
// function checkConcertInfo() {
//   const res = http.get(endpoints.checkConcertBySchedule, { tags: { name: 'checkConcertBySchedule' } });
//   console.log(res.body);
// }

// 테스트 종료 시 호출되는 함수
export function teardown() {
  console.log('테스트 종료');
  // 추가적인 정리 작업이 필요하면 여기에 구현
}
