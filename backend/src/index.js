"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '25mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '25mb' }));
// Gắn kết toàn bộ các phân hệ API của hệ thống HRM
app.use('/api', routes_1.default);
// Khởi chạy máy chủ
app.listen(PORT, () => {
    console.log(`[SERVER] LLA Enterprise HRM Backend is listening on port ${PORT}`);
});
exports.default = app;
