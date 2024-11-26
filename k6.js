import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// 테스트를 위한 대기열 API 엔드포인트들
const issueTokenUrl = 'http://127.0.0.1:3000/waiting-queue/issue'; // 대기열에 요청을 추가하는 엔드포인트
const checkTokenUrl = 'http://127.0.0.1:3000/waiting-queue/check'; // 대기열 상태를 조회하는 엔드포인트
const checkQueueSizeUrl = 'http://127.0.0.1:3000/waiting-queue/size'; // 대기열 크기를 조회하는 엔드포인트
const checkConcertByScheduleUrl = `http://127.0.0.1:3000/concert/schedule/{concertId}`; // 콘서트 정보를 조회하는 엔드포인트
const reserveConcertUrl = 'http://127.0.0.1:3000/reservation'; // 콘서트 예약을 요청하는 엔드포인트

const issueTokenTrend = new Trend('issueToken');
const checkTokenTrend = new Trend('checkToken');
const checkQueueSizeTrend = new Trend('checkQueueSize');
const checkConcertByScheduleTrend = new Trend('checkConcertBySchedule');
const reserveConcertTrend = new Trend('reserveConcert');

// 가상 사용자의 수와 테스트 지속 시간을 정의
export let options = {
  vus: 100, // 동시 가상 사용자 수
  duration: '30s', // 테스트 실행 시간
};

export default function () {
  //#region Issue Token
  // 대기열에 요청을 추가 (POST)
  let issueTokenParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'issueToken' },
  };
  let issueTokenRes = http.post(issueTokenUrl, undefined, issueTokenParams);
  issueTokenTrend.add(issueTokenRes.timings.duration, { status: 'duration' });
  issueTokenTrend.add(issueTokenRes.timings.waiting, { status: 'latency' });

  check(issueTokenRes, {
    '대기열 요청 성공': (r) => r.status === 201,
  });
  //#endregion

  // 응답에서 Authorization 헤더에서 Bearer 토큰 추출
  let authHeader = issueTokenRes.headers['Authorization'];
  let token = authHeader ? authHeader : null; // 'Bearer <token>'에서 <token> 부분만 추출

  //#region 응답 상태 체크 (GET)
  // 토큰이 존재하면 GET 요청에 Authorization 헤더를 추가
  if (token) {
    let checkParams = {
      headers: {
        authorization: token, // Bearer 토큰 추가
      },
      tags: { name: 'checkToken' },
    };

    // 대기열 상태를 조회 (GET)
    let checkTokenRes = http.get(checkTokenUrl, checkParams);
    console.log(checkTokenRes.body);
    // 대기 넘버 추출
    checkTokenTrend.add(JSON.parse(checkTokenRes.body).waitingNumber, {
      status: 'waitingNumber',
    });

    // 대기열 상태 조회 소요 시간 및 대기 시간 추출
    checkTokenTrend.add(checkTokenRes.timings.duration, { status: 'duration' });
    checkTokenTrend.add(checkTokenRes.timings.waiting, { status: 'latency' });
    check(checkTokenRes, {
      '대기열 상태 조회 성공': (r) => r.status === 200,
    });
  } else {
    console.error('Authorization token not found!');
  }
  //#endregion

  // Queue Size 조회.
  // let checkQueueSizeRes = http.get(checkQueueSizeUrl, {
  //   tags: { name: 'checkQueueSize' },
  // });
  // console.log(checkQueueSizeRes.body);
  // checkQueueSizeTrend.add(checkQueueSizeRes.body.)

  //#region 콘서트 정보 조회 (GET)

  // 콘서트 정보 조회 (GET)

  //#endregion

  // 일정 시간 대기
  sleep(3); // 1초 대기 후 반복
}
