import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // The game has no simulation code yet; CI still runs the suite so the first tests slot straight in.
    passWithNoTests: true,
  },
});
