const fs = require('fs');
const path = require('path');

// 1. Update App.jsx
const appPath = path.resolve(__dirname, '../../hrm-frontend/src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
  '<Route path="employees/transfers" element={<Transfers />} />',
  '<Route path="employees/transfers" element={<Navigate to="/internal/decisions/transfer" replace />} />'
);
appContent = appContent.replace(
  '<Route path="employees/transfers/:id" element={<TransferDetail />} />',
  '<Route path="employees/transfers/:id" element={<Navigate to="/internal/decisions/transfer" replace />} />'
);
fs.writeFileSync(appPath, appContent, 'utf8');
console.log('Updated App.jsx successfully!');

// 2. Update Decisions.jsx (replace Thuyên chuyển with Điều chuyển)
const decPath = path.resolve(__dirname, '../../hrm-frontend/src/pages/internal/employees/Decisions.jsx');
let decContent = fs.readFileSync(decPath, 'utf8');

decContent = decContent.replace(/Quyết Định Thuyên Chuyển/g, 'Quyết Định Điều Chuyển');
decContent = decContent.replace(/THUYÊN CHUYỂN CÔNG TÁC/g, 'ĐIỀU CHUYỂN CÔNG TÁC');
decContent = decContent.replace(/<ArrowRight size={12} style={{ display: 'inline', marginRight: '4px' }} \/>Thuyên chuyển/g, '<ArrowRight size={12} style={{ display: \'inline\', marginRight: \'4px\' }} />Điều chuyển');
decContent = decContent.replace(/<option value="TRANSFER">Thuyên chuyển<\/option>/g, '<option value="TRANSFER">Điều chuyển</option>');

fs.writeFileSync(decPath, decContent, 'utf8');
console.log('Updated Decisions.jsx successfully!');

// 3. Update DecisionCreate.jsx (replace Thuyên chuyển with Điều chuyển)
const createPath = path.resolve(__dirname, '../../hrm-frontend/src/pages/internal/employees/DecisionCreate.jsx');
let createContent = fs.readFileSync(createPath, 'utf8');

createContent = createContent.replace(/name: 'Thuyên chuyển'/g, "name: 'Điều chuyển'");
createContent = createContent.replace(/pageTitle: 'Soạn Thảo Quyết Định Thuyên Chuyển'/g, "pageTitle: 'Soạn Thảo Quyết Định Điều Chuyển'");
createContent = createContent.replace(/<option value="TRANSFER">Thuyên chuyển<\/option>/g, '<option value="TRANSFER">Điều chuyển</option>');

fs.writeFileSync(createPath, createContent, 'utf8');
console.log('Updated DecisionCreate.jsx successfully!');

