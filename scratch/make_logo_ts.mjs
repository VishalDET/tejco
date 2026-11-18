import fs from 'fs';
const buf = fs.readFileSync('c:/Users/ADMIN/Documents/GitHub/tejco/public/assets/images/tejco_report_logo.png');
const b64 = buf.toString('base64');
const content = `export const TEJCO_REPORT_LOGO = "data:image/png;base64,${b64}";\n`;
fs.writeFileSync('c:/Users/ADMIN/Documents/GitHub/tejco/src/app/intelligence/reports/tejco-logo.ts', content);
console.log('tejco-logo.ts written successfully');
