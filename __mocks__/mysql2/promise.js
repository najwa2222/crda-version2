// __mocks__/mysql2/promise.js
const mockConnection = {
    query: jest.fn(),
  };
  const mysql = {
    createConnection: jest.fn().mockResolvedValue(mockConnection),
  };
  
  export default mysql;
  