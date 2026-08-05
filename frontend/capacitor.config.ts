import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.soulmate.mobile',
  appName: 'SoulMate',
  webDir: 'dist',
  server: {
    // 开发时使用本地后端，Release 时配置你的服务器地址
    // androidScheme: 'https',
    cleartext: true, // 允许 HTTP 连接到本地/自部署服务器
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
