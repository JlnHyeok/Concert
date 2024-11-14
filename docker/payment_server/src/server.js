// server.js
const express = require('express');
const ApiService = require('./service');

const app = express();
const port = 4000;

// 외부 API 설정
const apiService = new ApiService('https://jsonplaceholder.typicode.com'); // 예시: JSONPlaceholder API

// 특정 엔드포인트 호출 예시
app.get('/api/posts', async (req, res) => {
  try {
    // 외부 API 호출 (GET /posts)
    const posts = await apiService.makeRequest('/posts');
    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: '외부 API 호출 실패', error: error.message });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});
