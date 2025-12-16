import axios from 'axios';

// 创建 axios 实例
// 注意：确保本地启动了 json-server，端口号根据实际情况调整，默认通常是 3000 或 3001
const api = axios.create({
  baseURL: 'http://localhost:3001', // 假设 json-server 运行在 3001 端口
  timeout: 5000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API 请求错误:', error);
    return Promise.reject(error);
  }
);

export default api;