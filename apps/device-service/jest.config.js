module.exports = {
  displayName: 'device-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/device-service',
  testMatch: ['<rootDir>/src/**/*.(spec|test).ts'],
  moduleNameMapper: {
    '^@app/common(.*)$': '<rootDir>/../../libs/common/src/$1',
  },
};