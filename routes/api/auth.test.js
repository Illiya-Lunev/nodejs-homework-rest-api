const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

const app = require('../../app');
const { User } = require('../../model/user');

const { DB_TEST_HOST } = process.env;

describe('test auth', () => {
  let server;
  beforeAll(() => (server = app.listen(3000)));
  afterAll(() => server.close());

  beforeEach(done => {
    mongoose.connect(DB_TEST_HOST).then(() => done());
  });

  afterEach(done => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(() => done());
    });
  });

  test('test signup route', async () => {
    const registerData = {
      name: 'test7',
      email: 'test7@gmail.com',
      password: '123456',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(registerData);

    expect(response.statusCode).toBe(201);

    const user = await User.findById(response.body._id);
    expect(user).toByTruthy();
    expect(user.name).toBe(registerData.name);
    expect(user.email).toBe(registerData.email);
  });

  test('test login route', async () => {
    const loginData = {
      email: 'test7@gmail.com',
      password: '123456',
    };

    const response = await request(app).post('/api/auth/login').send(loginData);

    expect(response.statusCode).toBe(200);
    expect(typeof response.body.token).toBe('string');

    const user = await User.findOne(response.body.email);
    expect(user).toBeTruthy();
    expect(user.email).toBe(loginData.email);
    expect(typeof user.email).toBe('string');
  });
});
