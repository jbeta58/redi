module.exports = {
  apps: [{
    name: 'redi',
    script: 'npm',
    args: 'start',
    cwd: '/root/redi',
    env: {
      NODE_ENV: 'production',
      AUTH_TRUST_HOST: 'true',
      NEXTAUTH_URL: 'https://rediapp.app'
    }
  }]
}
