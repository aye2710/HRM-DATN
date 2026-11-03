const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../../hrm-frontend/src/App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Replace internalLinks item for Nhân sự
const oldEmployeeBlockRegex = /\{\s*to:\s*'\/internal\/employees',\s*label:\s*'Nhân sự',\s*icon:\s*<Users size=\{20\} \/>,\s*children:\s*\[\s*\{\s*to:\s*'\/internal\/employees\/profiles',\s*label:\s*'Hồ sơ cá nhân'\s*\},\s*\{\s*to:\s*'\/internal\/employees\/contracts',\s*label:\s*'Hợp đồng lao động'\s*\},?\s*\]\s*\}/;

const newBlock = `{ to: '/internal/employees', label: 'Nhân sự', icon: <Users size={20} /> },\n  { to: '/internal/contracts', label: 'Hợp đồng', icon: <FileText size={20} /> }`;

if (oldEmployeeBlockRegex.test(content)) {
  content = content.replace(oldEmployeeBlockRegex, newBlock);
  console.log('Replaced employee block in internalLinks!');
} else {
  console.log('Regex did not match oldEmployeeBlockRegex');
}

// Add routes
if (content.includes('<Route path="employees/profiles" element={<EmployeeList />} />')) {
  content = content.replace(
    '<Route path="employees/profiles" element={<EmployeeList />} />',
    `<Route path="employees" element={<EmployeeList />} />\n              <Route path="employees/profiles" element={<Navigate to="/internal/employees" replace />} />\n              <Route path="employees/:id" element={<EmployeeDetail />} />\n              <Route path="contracts" element={<Contracts />} />\n              <Route path="contracts/:id" element={<ContractDetail />} />`
  );
  console.log('Replaced routes!');
} else {
  console.log('Routes already present or target not found');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.jsx saved successfully.');

