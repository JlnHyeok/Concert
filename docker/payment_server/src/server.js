// server.js
const { Kafka } = require('kafkajs');
const express = require('express');

const app = express();
const port = 4000;

const nodeEnv = process.env.NODE_ENV;
console.log('nodeEnv:', nodeEnv);
const url =
  nodeEnv == 'test' ? 'Kafka00ServiceTest:9092' : 'Kafka00Service:9092';

const kafka = new Kafka({
  clientId: 'payment_server',
  brokers: [url],
});

const consumer = kafka.consumer({ groupId: 'payment-group' });
const producer = kafka.producer();

// 외부 API 설정
const initKafka = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'payment' });

  await producer.connect();
  await consumer?.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('외부 API 호출');
      console.log(message.value.toString());
      let reseivedData = JSON.parse(message.value.toString());
      try {
        console.log('결제 완료');
        await producer.send({
          topic: 'payment-success',
          messages: [
            {
              key: message.key,
              value: JSON.stringify({
                ...reseivedData,
                isSuccess: true,
                message: '결제 성공',
              }),
            },
          ],
        });
      } catch (e) {
        await producer.send({
          topic: 'payment-fail',
          messages: [
            {
              key: message.key,
              value: JSON.stringify({
                ...reseivedData,
                isSuccess: false,
                message: '결제 실패',
              }),
            },
          ],
        });
      }
    },
    autoCommit: true,
  });
};

// 특정 엔드포인트 호출 예시
app.post('/api/payment', async (req, res) => {
  console.log('결제 요청이 왔습니다');
  try {
    // 외부 API 호출 (GET /posts)
    res.status(200).json({ isSuccess: true, message: '결제 성공' });
  } catch (error) {
    res.status(500).json({ message: '결제 실패', error: error.message });
  }
});

initKafka();

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});
