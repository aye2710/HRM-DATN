import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
};

const files = walk('./src/pages');

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('alert(')) {
    // Basic replacements
    content = content.replace(/alert\((.*?(?:thành công|xong|Đã).*?)\)/g, 'toast.success($1)');
    content = content.replace(/alert\((.*?)\)/g, 'toast.error($1)'); // Any remaining alert becomes toast.error

    // Add import if not present
    if (!content.includes("import toast")) {
      // insert after the last import or at the top
      const importStatement = "import toast from 'react-hot-toast';\n";
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      content = lines.join('\n');
    }

    // Since we replaced all alert() with toast(), there might be cases where window.confirm() was used before alert. 
    // We didn't change window.confirm.

    fs.writeFileSync(file, content, 'utf-8');
    console.log('Modified:', file);
    modifiedCount++;
  }
});

console.log(`Replaced alerts in ${modifiedCount} files.`);
