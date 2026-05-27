import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/src', '<rootDir>/tests/integration'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/test-support/**/*.ts',
    '!src/types/**/*.ts',
    '!src/api-main.ts',
    '!src/api.module.ts',
    '!src/adapters/inbound/http/bearer-auth.guard.ts',
    '!src/adapters/outbound/crypto/node-bearer-token.adapter.ts',
    '!src/application/use-cases/process-recognition-task.use-case.ts',
    '!src/index.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};

export default config;