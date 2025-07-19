module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
};