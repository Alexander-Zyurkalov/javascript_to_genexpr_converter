// jest.config.ts
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            // ts-jest configuration goes here
            tsconfig: 'tsconfig.json'
        }]
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true,
};
