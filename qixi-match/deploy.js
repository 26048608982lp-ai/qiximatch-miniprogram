const { exec } = require('child_process');
const path = require('path');

console.log('开始部署到Vercel...');

// 先确保构建成功
exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('构建失败:', error);
    return;
  }
  
  console.log('构建成功，开始部署...');
  
  // 使用vercel CLI部署
  exec('vercel --prod --yes', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('部署失败:', error);
      return;
    }
    
    console.log('部署成功!');
    console.log('输出:', stdout);
  });
});