import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// API 엔드포인트 설정
const API_BASE_URL = 'http://127.0.0.1:3000';

const endpoints = {
  issueToken: `${API_BASE_URL}/waiting-queue/issue`,
  checkToken: `${API_BASE_URL}/waiting-queue/check`,
  deleteToken: `${API_BASE_URL}/waiting-queue/delete-all`,
  reserveConcert: `${API_BASE_URL}/reservation/seat`,
  paymentSeat: `${API_BASE_URL}/reservation/payment`,
};

const checkTokenTrend = new Trend('checkToken');

// 가상 사용자 수 및 테스트 지속 시간 설정
export let options = {
  stages: [
    { duration: '30s', target: 800 },
    { duration: '1m', target: 1000 },
  ],
  // vus: 1000,
  // duration: '30s',
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

  sleep(5);
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
      sleep(Math.random() * 1);
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
      // console.log(checkTokenRes.body);

      // 대기 넘버 추출
      const queueInfo = JSON.parse(checkTokenRes.body);
      const waitingNumber = queueInfo?.waitingNumber;

      if (waitingNumber) {
        checkTokenTrend.add(waitingNumber, { status: 'waitingNumber' });
      }

      if (queueInfo?.status == 'PROCESSING') {
        const reservationParams = {
          headers: {
            authorization: token, // Bearer 토큰 추가
            'Content-Type': 'application/json',
          },
          tags: { name: 'reserveConcert' },
        };

        console.log('대기열 상태가 PRCESSING 으로 변경되었습니다.');

        const concertId = Math.ceil(Math.random() * 10);
        const userId = Math.ceil(Math.random() * 500);
        const seatNumber = Math.ceil(Math.random() * 100);
        const reservationRes = http.post(
          endpoints.reserveConcert,
          JSON.stringify({
            userId,
            concertId,
            performanceDate: '2024-11-28',
            seatNumber,
          }),
          reservationParams,
        );

        check(reservationRes, {
          '예약 요청 성공': (r) => r.status === 201,
        });

        if (reservationRes.status == 201) {
          const parsedJsonReservationBody = JSON.parse(reservationRes.body);

          const paymentParams = {
            headers: {
              authorization: token, // Bearer 토큰 추가
              'Content-Type': 'application/json',
            },
            tags: { name: 'paymentSeat' },
          };

          const paymentRes = http.post(
            endpoints.paymentSeat,
            JSON.stringify({
              userId,
              seatId: parsedJsonReservationBody.seat.id,
            }),
            paymentParams,
          );
          console.log('결제 요청을 보냈습니다.');

          check(paymentRes, {
            '결제 요청 성공': (r) => r.status === 201,
          });
        }
      }
    } catch (error) {
      console.log('CHECK TOKEN ERROR', error);
    }

    sleep(1); // 대기열 상태 조회 후 1초 대기
  }

  check(checkTokenRes, {
    '대기열 상태 조회 성공': (r) => r.status === 200,
  });
}

// 테스트 종료 시 호출되는 함수
export function teardown() {
  console.log('테스트 종료');
  // 추가적인 정리 작업이 필요하면 여기에 구현

  http.post(endpoints.deleteToken, undefined, {
    tags: { name: 'deleteAllToken' },
  });
}
