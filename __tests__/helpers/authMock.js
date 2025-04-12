// __tests__/helpers/authMock.js

/**
 * Creates a mocked authenticated session for testing
 * @param {Object} app - The Express app
 * @param {Object} user - User object to set in session
 * @returns {Object} - Supertest request object with authenticated session
 */
import request from 'supertest'; // Add this line to import supertest

export function authenticatedSession(app, user = {}) {
    const agent = request.agent(app);
    
    // Mock the session middleware for this agent
    const originalSend = agent.send;
    agent.send = function() {
      const req = arguments[0];
      req.session = {
        user: {
          id: 1,
          email_user: 'test@crda.com',
          role_user: 'chef_dentreprise',
          nom_user: 'Test',
          prenom_user: 'User',
          ...user
        },
        save: (cb) => cb && cb()
      };
      return originalSend.apply(this, arguments);
    };
    
    return agent;
  }
  
  /**
   * Creates a mocked session with specific role
   * @param {Object} app - The Express app
   * @param {String} role - Role to set ('chef_dentreprise', 'gerant', 'directeur')
   * @returns {Object} - Supertest request object with role-based authentication
   */
  export function authenticatedRole(app, role) {
    return authenticatedSession(app, { role_user: role });
  }