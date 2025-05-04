module.exports = {
  name: 'too-doo-list',
  region: 'us-east-1',
  build: {
    command: 'npm install && npm run build',
    output: 'build',
  },
  deploy: {
    command: 'npx expo export',
  },
};
