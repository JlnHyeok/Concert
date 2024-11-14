// apiService.js
const axios = require('axios');

class ApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      timeout: 5000, // 요청 타임아웃 설정 (5초)
    });
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const response = await this.api.request({
        url: endpoint,
        method,
        data,
      });
      return response.data; // 응답 데이터 반환
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error.message);
      throw new Error('API 요청 실패');
    }
  }
}

module.exports = ApiService;
