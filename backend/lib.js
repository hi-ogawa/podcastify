const _ = require('lodash');

const fetchTextViaProxyList = require('./fetchTextViaProxyList');
const { getPlaylist, getChannel } = require('./youtubeApi.js');

// NOTE:
// For now, go exclusively with webm, just hoping this format is always available.
// If it's not, then client will get m4a or something, contradicting with enclosure type.
// But, it seems most clients can robustly handle those cases.
const MIME_TYPE = 'audio/webm';

const cdata = (text) => `<![CDATA[${text}]]>`;

const emitChannelInfo = ({ title, author, link, imageUrl }) => `
  <title>${cdata(title)}</title>
  <link>${link}</link>
  <itunes:author>${cdata(author)}</itunes:author>
  <itunes:image href="${imageUrl}"/>
`;

const emitItem = ({ title, description, author, link, imageUrl, enclosureUrl, guid, pubDate }) => `
  <item>
    <title>${cdata(title)}</title>
    <description>${cdata(description)}</description>
    <dc:creator>${cdata(author)}</dc:creator>
    <link>${link}</link>
    <enclosure url="${enclosureUrl}" type="${MIME_TYPE}" />
    <itunes:image href="${imageUrl}"/>
    <guid>${guid}</guid>
    <pubDate>${pubDate}</pubDate>
  </item>
`;

const getChannelId = async (user) => {
  const url = `http://www.youtube.com/user/${user}`;
  let text;
  try {
    text = await fetchTextViaProxyList(url);
  } catch (e) {
    console.log(`error fetchTextViaProxyList(${url})`, e.message);
    return;
  }
  // NOTE: "?" finds shortest match.
  const m = text.match(/<link rel="canonical" href="(.*)\/channel\/(.*?)">/);
  if (!(m && m[2])) {
    console.log(`error getChannelId: channel id not found.`);
    return;
  }
  return m[2];
}

const getTypeAndIdFromUrl = async (url) => {
  let obj;
  try {
    obj = new URL(url);
  } catch (e) {
    console.error(e);
    return;
  }

  // e.g. https://www.youtube.com/playlist?list=PLFPXn0FXBEuEiDDbjTh819LThGqUEWaYM
  const playlistId = obj.searchParams.get('list');
  if (playlistId) {
    return { type: 'playlist', id: playlistId };
  }

  // e.g. https://www.youtube.com/channel/UCklUqFEcJqFnWKEBozw5p4g
  const m1 = obj.pathname.match(/\/channel\/(.*)/);
  if (m1 && m1[1]) {
    return { type: 'channel', id: m1[1] };
  }

  // e.g. https://www.youtube.com/user/AnastasiSemina
  const m2 = obj.pathname.match(/\/user\/(.*)/);
  if (m2 && m2[1]) {
    const user = m2[1];
    const id = await getChannelId(user);
    if (!id) { return; }
    return { type: 'channel', id };
  }
}

const youtubeUrlToRss = async (url, youtubeEnclosureUrl) => {
  const obj = await getTypeAndIdFromUrl(url);
  if (!obj) { return; }

  const { type, id } = obj;

  let resource;
  if (type === 'playlist') {
    resource = await getPlaylist(id);
  }
  if (type === 'channel') {
    resource = await getChannel(id);
  }
  if (!resource) { return; }

  resource.items.forEach(item => {
    item.enclosureUrl = `${youtubeEnclosureUrl}?videoId=${item.id}`;
    item.description = item.description.replace(/\n/g, '<br />');
  });

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" \
         xmlns:dc="http://purl.org/dc/elements/1.1/" \
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" \
         xmlns:content="http://purl.org/rss/1.0/modules/content/" >
      <channel>
        ${emitChannelInfo(resource)}
        ${resource.items.map(emitItem).join('')}
      </channel>
    </rss>
  `.trim();
}

const extractFormats = (text) => {
  const decoded = decodeURIComponent(text);
  const param = decoded.split('&').find(param => param.startsWith('player_response='));
  const player_response = JSON.parse(param.replace('player_response=', ''));
  const formats1 = player_response.streamingData.formats;
  const formats2 = player_response.streamingData.adaptiveFormats;
  const fields = ['itag', 'url', 'contentLength', 'mimeType',
                  'quality', 'qualityLabel', 'audioQuality', 'bitrate', 'audioSampleRate'];
  return _.map(_.concat(formats1, formats2), f => _.pick(f, fields));
}

const chooseFormat = (formats) =>
  formats.find(f => f.mimeType.match(MIME_TYPE) && f.audioQuality !== 'AUDIO_QUALITY_LOW') ||
  formats.find(f => f.mimeType.match(MIME_TYPE)) ||
  formats.find(f => f.mimeType.match('audio'))

// (Dirty) download time optimization
// cf. https://github.com/hi-ogawa/range-split-proxy
const RANGE_SPLIT_PROXY_URL = 'https://range-split-proxy.herokuapp.com/';

const videoIdToAudioUrl = async (videoId) => {
  let text;
  try {
    text = await fetchTextViaProxyList(`https://www.youtube.com/get_video_info?video_id=${videoId}&gl=US&hl=en`);
  } catch (e) {
    console.log(e.message);
    return;
  }

  const formats = extractFormats(text);
  const format = chooseFormat(formats);
  if (!format) { return; }

  const audioUrl = encodeURIComponent(format.url);
  const proxyUrl = `${RANGE_SPLIT_PROXY_URL}?url=${audioUrl}`;
  return proxyUrl;
}

module.exports = {
  youtubeUrlToRss,
  videoIdToAudioUrl,
};
