/**
 * Cypress E2E Testing Configuration
 * Following TRS Section 11: "visit home → click a node → assert KPI renders"
 * 
 * Note: This will be properly configured once Cypress is installed
 */

const cypressConfig = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },
};

export default cypressConfig; 