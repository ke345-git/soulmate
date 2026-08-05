const config = {
  appId: 'app.soulmate.mobile',
  appName: 'SoulMate',
  webDir: 'dist',
  server: {
    cleartext: true, // 允许 HTTP 连接到自部署服务器
  },
  android: {
    allowMixedContent: true,
  },
};

module.exports = config;
