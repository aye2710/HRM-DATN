import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Phục vụ tệp tĩnh (ảnh tải lên, hợp đồng, quyết định)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Gắn kết toàn bộ các phân hệ API của hệ thống HRM
app.use('/api', apiRouter);

// Khởi chạy máy chủ API
app.listen(PORT, () => {
  console.log(`[SERVER] LLA Enterprise HRM Backend is listening on port ${PORT}`);
});

export default app;
