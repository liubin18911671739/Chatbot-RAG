/**
 * 加密工具函数，用于加密用户名和密码
 * 此处采用一种简单的加密方式，实际生产环境可能需要更复杂的加密算法
 */

import CryptoJS from 'crypto-js'; // 需要安装: npm install crypto-js

/**
 * 加密函数
 * @param {string} text - 需要加密的文本
 * @returns {string} - 加密后的文本
 */
export function encrypt(text) {
  // 加密密钥，实际应用中应从环境变量或配置文件中获取
  const secretKey = process.env.VUE_APP_ENCRYPTION_KEY || 'bisu-default-key';
  
  // 使用AES加密
  const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString();
  
  return encrypted;
}

/**
 * 解密函数 (如有需要)
 * @param {string} encryptedText - 加密后的文本
 * @returns {string} - 解密后的文本
 */
export function decrypt(encryptedText) {
  const secretKey = process.env.VUE_APP_ENCRYPTION_KEY || 'bisu-default-key';
  
  // 使用AES解密
  const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  
  return decrypted;
}