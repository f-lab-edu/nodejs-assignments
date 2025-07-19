module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.spec.ts$',
    '.test.ts$',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};