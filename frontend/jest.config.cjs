module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/src/tests/**/*.spec.js',
    '**/__tests__/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!**/node_modules/**'
  ],
  coverageReporters: [
    'html',
    'text',
    'lcov'
  ],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['js', 'json', 'vue'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
