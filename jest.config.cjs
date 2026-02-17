module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/mcp-services/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.{js,mjs}'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'mcp-services/src/routes/auth.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
