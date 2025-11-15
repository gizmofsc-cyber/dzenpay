const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts'
  ]
}

module.exports = createJestConfig(customJestConfig)

