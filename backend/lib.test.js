const assert = require('assert').strict;

const {youtubeUrlToRss, videoIdToAudioUrl} = require('./lib');

describe('youtubeUrlToRss', () => {
  it('playlist', async () => {
    const url = 'https://www.youtube.com/playlist?list=PL7sA_SkHX5ye8sYG5tOdvGfNZef5b7hx7';
    const rss = await youtubeUrlToRss(url, 'http://XXX/');
    assert(rss);
  });

  it('channel', async () => {
    const url = 'https://www.youtube.com/channel/UCklUqFEcJqFnWKEBozw5p4g';
    const rss = await youtubeUrlToRss(url, 'http://XXX/');
    assert(rss);
  });

  it('user', async () => {
    const url = 'https://www.youtube.com/user/AnastasiSemina';
    const rss = await youtubeUrlToRss(url, 'http://XXX/');
    assert(rss);
  });
});

describe('videoIdToAudioUrl', () => {
  it('1', async () => {
    const videoId = 'WpENoTmJhRM';
    const url = await videoIdToAudioUrl(videoId);
    assert(url);
  });
});
