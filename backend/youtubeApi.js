const _ = require('lodash');
const fetch = require('node-fetch');

const KEY = require('../secrets.json')['youtube_api_key'];

const ENDPOINT = 'https://www.googleapis.com/youtube/v3';

const fetchTextWithParams = async (url, params) => {
  const query = _.toPairs(params).map(([k, v]) => `${k}=${v}`).join('&');
  const resp = await fetch(`${url}?${query}`);
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(text || resp.statusText);
  }
  return text;
}

const getPlaylist = async (id) => {
  let playlistsResp, playlistItemsResp;

  //
  // playlist info
  //
  {
    const params = {
      key: KEY,
      id: id,
      part: 'snippet',
    };
    try {
      const text = await fetchTextWithParams(`${ENDPOINT}/playlists`, params);
      playlistsResp = JSON.parse(text);
    } catch (e) {
      console.log(e.message);
      return;
    }
  }


  //
  // playlist videos
  //
  {
    const params = {
      key: KEY,
      playlistId: id,
      part: 'snippet',
      maxResults: 50,
    };
    try {
      const text = await fetchTextWithParams(`${ENDPOINT}/playlistItems`, params);
      playlistItemsResp = JSON.parse(text);
    } catch (e) {
      console.log(e.message);
      return;
    }
  }

  //
  // Parse response
  //

  if (playlistsResp.items.length !== 1) {
    return;
  }

  const { title, channelTitle } = playlistsResp.items[0].snippet;

  const items = playlistItemsResp.items.map(item => {
    const {
      title, description,
      publishedAt, // NOTE: "publishedAt" is the date when video is added to the playlist
      resourceId: { videoId },
      thumbnails: { high: { url } }
    } = item.snippet;
    return {
      title, description,
      author: '', // NOTE: playlistItems doesn't include author info
      id: videoId,
      imageUrl: url,
      pubDate: (new Date(publishedAt)).toUTCString(),
      link: `https://www.youtube.com/watch?v=${videoId}`,
      guid: `${id}__${videoId}`,
    };
  });

  return {
    title: title,
    author: channelTitle,
    link: `https://www.youtube.com/playlist?list=${id}`,
    imageUrl: items[0] ? items[0].imageUrl : '',
    items: items,
  }
}

const getChannel = async (id) => {
  let channelsResp, searchResp;

  //
  // channel info
  //
  {
    const params = {
      key: KEY,
      id: id,
      part: 'snippet',
    };
    try {
      const text = await fetchTextWithParams(`${ENDPOINT}/channels`, params);
      channelsResp = JSON.parse(text);
    } catch (e) {
      console.log(e.message);
      return;
    }
  }


  //
  // channel videos
  //
  {
    const params = {
      key: KEY,
      channelId: id,
      part: 'id,snippet',
      order: 'date',
      type: 'video',
      maxResults: 50,
    };
    try {
      const text = await fetchTextWithParams(`${ENDPOINT}/search`, params);
      searchResp = JSON.parse(text);
    } catch (e) {
      console.log(e.message);
      return;
    }
  }

  //
  // Parse response
  //
  if (channelsResp.items.length !== 1) {
    return;
  }

  const {
    title: author,
    thumbnails: { medium: { url }}
  } = channelsResp.items[0].snippet;

  const items = searchResp.items.map(item => {
    const { videoId } = item.id;
    const {
      title, description,
      publishedAt,
      thumbnails: { high: { url } }
    } = item.snippet;
    return {
      title, description,
      author,
      id: videoId,
      imageUrl: url,
      pubDate: (new Date(publishedAt)).toUTCString(),
      link: `https://www.youtube.com/watch?v=${videoId}`,
      guid: `${id}__${videoId}`,
    };
  });

  return {
    title: author,
    author: author,
    link: `https://www.youtube.com/chennel/${id}`,
    imageUrl: url,
    items: items,
  }
}

module.exports = {
  getPlaylist,
  getChannel
};
