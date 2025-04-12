// __mocks__/express-mysql-session.js
export default function(session) {
  return class MockStore extends session.Store {
    constructor(options) {
      super(options);
      
      // Mock database connection
      this.connection = {
        query: () => Promise.resolve([])
      };

      // Required session store methods
      this.set = (sid, sessionData, callback) => callback(null);
      this.get = (sid, callback) => callback(null, null);
      this.destroy = (sid, callback) => callback(null);
      this.touch = (sid, sessionData, callback) => callback(null);
      
      // Event emitter stub
      this.on = () => this;
    }

    // Add optional cleanup method
    close() {
      return Promise.resolve();
    }
  };
};