import express from 'express';
import cors from 'cors';
import apiRouter from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Gắn kết toàn bộ các phân hệ API của hệ thống HRM
app.use('/api', apiRouter);

// Khởi chạy máy chủ
app.listen(PORT, () => {
  console.log(`[SERVER] LLA Enterprise HRM Backend is listening on port ${PORT}`);
});

export default app;
