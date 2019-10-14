const assert = require('assert').strict;

const { getPlaylist, getChannel } = require('./youtubeApi.js');

describe('getPlaylist', () => {
  it('1', async () => {
    const id = 'PL7sA_SkHX5ye8sYG5tOdvGfNZef5b7hx7';
    const playlist = await getPlaylist(id);
    assert(playlist);
  });
});

describe('getChannel', () => {
  it('1', async () => {
    const id = 'UCYS8BOA0Y7nGY7kJJw8hvAA';
    const channel = await getChannel(id);
    assert(channel);
  });
});
