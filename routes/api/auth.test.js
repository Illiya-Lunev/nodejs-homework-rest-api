const app = require('../../app');
const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

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

  test('test signup route ', async () => {
    const regData = {
      name: 'Test',
      email: 'test@mail.com',
      password: '123aaa',
    };
    const response = await request(app).post('api/auth/signup ').send(regData);

    expect(response.statusCode).toBe(201);
    const user = await User.findOne(response.body.email);
    expect(user).toBeTruthy();
    expect(user.name).toBe(regData.name);
    expect(user.email).toBe(regData.email);
  });
});
