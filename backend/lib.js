const assert = require('assert').strict;
const crypto = require('crypto');
const fetch = require('./fetch.js');
const { JSDOM } = require('jsdom');
const _ = require('lodash');
const { encodeURIComponent } = global;

// NOTE:
// For now, go exclusively with webm, just hoping this format is always available.
// If it's not, then client gets error when accessing enclosure url.
const MIME_TYPE = 'audio/webm';

const cdata = (text) => `<![CDATA[${text}]]>`;

const genChannelInfo = ({ title, link, imageUrl }) => `
  <title>${cdata(title)}</title>
  <link>${link}</link>
  <itunes:author>${cdata(title)}</itunes:author>
  <itunes:image href="${imageUrl}"/>
`;

const genItem = ({ title, description, author, link, imageUrl, enclosureUrl, guid, pubDate }) => `
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
  const resp = await fetch.fetch(url);
  assert(resp.ok);
  const text = await resp.text();
  // NOTE: "?" finds shortest match.
  const m = text.match(/<link rel="canonical" href="(.*)\/channel\/(.*?)">/);
  assert(m && m[2]);
  return m[2];
}

// NOTE:
// It seems the feed consists of the latest 15 videos under the channel.
// Actually we don't have to use original feeds to obtain the list of videos, but
// it is for starter because it's easy to use it.
const getRss = async (type, id, mkEnclosureUrl) => {
  if (type === 'user') {
    type = 'channel';
    id = await getChannelId(id);
  }

  const feedUrl = `http://www.youtube.com/feeds/videos.xml?${type}_id=${id}`;
  let feed;
  try {
    const resp = await fetch.fetch(feedUrl);
    if (!resp.ok) { return; }
    feed = await resp.text();
  } catch (e) { return; }

  return feed2rss(feed, type, id, mkEnclosureUrl);
}

const feed2rss = (feed, type, id, mkEnclosureUrl) => {
  const dom = new JSDOM(feed, { contentType: 'text/xml' });
  const doc = dom.window.document;

  // Items
  const entries = doc.querySelectorAll('entry')
  const items = Array.from(entries).map(e => {
    const title = e.querySelector('title').textContent;
    const description = e.querySelector('media\\:description').textContent.replace(/\n/g, '<br />');
    const videoUrl = e.querySelector('link[rel="alternate"]').getAttribute('href');
    const imageUrl = e.querySelector('media\\:thumbnail').getAttribute('url');
    const published = e.querySelector('published').textContent;
    const author = e.querySelector('author > name').textContent;

    const enclosureUrl = mkEnclosureUrl(videoUrl);

    // Don't know what guid has to be. Just make it unique-ish within podcastify.
    const hash = crypto.createHash('md5');
    hash.update(type + '@' + id + '@' + enclosureUrl);
    const guid = hash.digest('hex')

    return {
      title, description, imageUrl, guid, author, enclosureUrl,
      link: videoUrl,
      pubDate: (new Date(published)).toUTCString(),
    };
  });

  // Channel info
  const title = doc.querySelector('feed > title').textContent;
  const link =
    (type === 'channel'  && `http://www.youtube.com/channel/${id}`) ||
    (type === 'playlist' && `http://www.youtube.com/playlist?list=${id}`)
  const channelInfo = genChannelInfo({
    title: `${title} (podcastify)`,
    link,
    imageUrl: items[0].imageUrl
  });

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" \
         xmlns:dc="http://purl.org/dc/elements/1.1/" \
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" \
         xmlns:content="http://purl.org/rss/1.0/modules/content/" >
      <channel>
        ${channelInfo}
        ${''.concat(...items.map(genItem))}
      </channel>
    </rss>
  `.trim();
}

const extractFormats = (content) => {
  const mobj = content.match(/;ytplayer\.config\s*=\s*({.+?});ytplayer/);
  const config = JSON.parse(mobj[1]);
  const player_response = JSON.parse(config.args.player_response);
  const formats1 = player_response.streamingData.formats;
  const formats2 = player_response.streamingData.adaptiveFormats;
  const fields = ['itag', 'url', 'contentLength', 'mimeType',
                  'quality', 'qualityLabel', 'audioQuality', 'bitrate', 'audioSampleRate'];
  return _.map(_.concat(formats1, formats2), f => _.pick(f, fields));
}

const chooseFormat = (formats) =>
  formats.find(f => f.mimeType.match(MIME_TYPE) && f.audioQuality !== 'AUDIO_QUALITY_LOW') ||
  formats.find(f => f.mimeType.match(MIME_TYPE))

const getAudioUrl = async (videoUrl) => {
  const resp = await fetch.fetch(videoUrl);
  const text = await resp.text();
  const formats = extractFormats(text);
  const format = chooseFormat(formats);
  if (!format) { return; }
  return format.url;
}

module.exports = { getRss, getAudioUrl };
