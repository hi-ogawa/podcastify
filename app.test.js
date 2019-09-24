const assert = require('assert').strict;
const supertest = require('supertest');
const sinon = require('sinon');
const util = require('util');
const fs = require('fs');

const app = require('./app');

describe('GET /rss', () => {
  // Real request
  it('Real fetch', async () => {
    await supertest(app)
      .get('/rss')
      .query({ type: 'channel', id: 'UCklUqFEcJqFnWKEBozw5p4g' })
      .expect(res => {
        assert.strictEqual(res.status, 200)
      })
  });

  // Mocked request
  describe('Mocked fetch', () => {
    // cf. https://stackoverflow.com/questions/37343232/sinon-js-only-stub-a-method-once
    let sandbox;
    beforeEach(() => sandbox = sinon.createSandbox());
    afterEach(() => sandbox.restore());

    it('success', async () => {
      const text = (await util.promisify(fs.readFile)('fixtures/feed1.xml')).toString();
      sandbox.stub(require('./fetch.js'), 'fetch').resolves({ ok: true, text: () => Promise.resolve(text) })

      await supertest(app)
        .get('/rss')
        .query({ type: 'channel', id: 'whatever-will-be-mocked' })
        .expect(res => {
          assert.strictEqual(res.status, 200)
        })
    });
  })

  it('Missing parameter', async () => {
    await supertest(app)
      .get('/rss')
      .expect(res => {
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.text, 'Required parameter: type, id');
      })
  });

  it('Invalid parameter', async () => {
    await supertest(app)
      .get('/rss')
      .query({ type: 'channel', id: '784b74088aef459c3b6c1b83b632c467f957ebb6' })
      .expect(res => {
        assert.strictEqual(res.status, 400);
      })
  });
});


describe('GET /enclosure', () => {
  it('Redirection', async () => {
    const videoUrl = 'https://www.youtube.com/watch?v=WpENoTmJhRM';
    await supertest(app)
      .get('/enclosure')
      .query({ videoUrl })
      .expect(res => {
        assert.strictEqual(res.status, 302);
        assert(res.text.match(/Found. Redirecting to https:\/\/(.*)\.googlevideo\.com/));
      })
  });
});
