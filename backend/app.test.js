const assert = require('assert').strict;
const supertest = require('supertest');

const app = require('./app');

describe('GET /youtube', () => {
  it('playlist', async () => {
    const url = 'https://www.youtube.com/playlist?list=PL7sA_SkHX5ye8sYG5tOdvGfNZef5b7hx7';
    await supertest(app)
      .get('/youtube')
      .query({ url })
      .expect(res => {
        assert.strictEqual(res.status, 200);
      })
  });
});

describe('GET /youtubeEnclosure', () => {
  it('1', async () => {
    const videoId = 'WpENoTmJhRM';
    await supertest(app)
      .get('/youtubeEnclosure')
      .query({ videoId })
      .expect(res => {
        assert.strictEqual(res.status, 302);
        assert(res.text.match('Found. Redirecting to'));
        assert(res.text.match('https://range-split-proxy.herokuapp.com'));
        assert(res.text.match('.googlevideo.com%2Fvideoplayback'));
      })
  });
});
