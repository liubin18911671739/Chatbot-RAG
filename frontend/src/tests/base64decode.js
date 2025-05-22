// 测试base64解码函数
const testBase64Decode = () => {
  // 原始base64字符串
  const base64Content = "5YWa5pS/5Yqe5YWs5a6k57u85ZCI5LqL5Yqh55qE55S16K+d5piv5aSa5bCR77yf";
  
  // 解码过程
  let decodedContent = '';
  try {
    // 使用atob进行base64解码
    const base64Decoded = atob(base64Content);
    
    // 处理中文UTF-8编码问题
    try {
      // 这种方法可以处理中文字符
      decodedContent = decodeURIComponent(escape(base64Decoded));
    } catch (e) {
      console.warn('UTF-8 解码失败，使用原始解码结果');
      decodedContent = base64Decoded;
    }
  } catch (e) {
    console.error('Base64解码失败:', e);
    decodedContent = '解码失败的内容';
  }
  
  // 输出解码后的内容
  console.log('解码后的内容:', decodedContent);
  return decodedContent;
};

// 如果在浏览器环境中，可以执行测试
if (typeof window !== 'undefined') {
  console.log('执行base64解码测试');
  testBase64Decode();
}

// 导出函数供其他模块使用
export { testBase64Decode };
