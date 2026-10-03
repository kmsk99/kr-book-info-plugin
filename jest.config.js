/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
    },
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverage: true,
    collectCoverageFrom: ['main.ts', 'src/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: ['**/tests/**/*.test.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__mocks__/',
        '/tests/',
        'version-bump.mjs',
        'esbuild.config.mjs'
    ],
    coverageThreshold: {
        global: { branches: 95, functions: 100, lines: 100, statements: 100 },
        './src/': {
            branches: 95,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};
