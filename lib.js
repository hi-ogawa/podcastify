const crypto = require('crypto');
const fetch = require('./fetch.js');
const { JSDOM } = require('jsdom');
const _ = require('lodash');
const { encodeURIComponent } = global;

const cdata = (text) => `<![CDATA[${text}]]>`;

const genChannelInfo = ({ title, link }) => `
  <title>${cdata(title)}</title>
  <link>${link}</link>
  <itunes:author>${cdata(title)}</itunes:author>
`;

// NOTE:
// At this point, we cannot determine mime-type yet, but if we don't set mime-type, then it seems podcast client will
// usually ignore such item. So, here we randomly set it as "audio/mpeg" even if real audio data might be not "audio/mpeg".
// For the podcast clients we tested (FeedBro, cantata), this strategy works.
const genItem = ({ title, description, author, link, imageUrl, enclosureUrl, guid, pubDate }) => `
  <item>
    <title>${cdata(title)}</title>
    <description>${cdata(description)}</description>
    <dc:creator>${cdata(author)}</dc:creator>
    <link>${link}</link>
    <enclosure url="${enclosureUrl}" type="audio/mpeg" />
    <itunes:image href="${imageUrl}"/>
    <guid>${guid}</guid>
    <pubDate>${pubDate}</pubDate>
  </item>
`;

// NOTE:
// It seems the feed consists of the latest 15 videos under the channel.
// Actually we don't have to use original feeds to obtain the list of videos, but
// for starter, it's easy to use it.
const getRss = async (type, id, enclosurePath) => {
  const feedUrl = `http://www.youtube.com/feeds/videos.xml?${type}_id=${id}`;
  let feed;
  try {
    const resp = await fetch.fetch(feedUrl);
    if (!resp.ok) { return; }
    feed = await resp.text();
  } catch (e) { return; }

  return feed2rss(feed, type, id, enclosurePath);
}

const feed2rss = (feed, type, id, enclosurePath) => {
  const dom = new JSDOM(feed, { contentType: 'text/xml' });
  const doc = dom.window.document;

  // Channel info
  const title = doc.querySelector('feed > title').textContent;
  const link =
    (type === 'channel'  && `http://www.youtube.com/channel/${id}`) ||
    (type === 'playlist' && `http://www.youtube.com/playlist?list=${id}`)
  const channelInfo = genChannelInfo({
    title: `${title} (podcastify)`,
    link,
  });

  // Items
  const entries = doc.querySelectorAll('entry')
  const items = Array.from(entries).map(e => {
    const title = e.querySelector('title').textContent;
    const description = e.querySelector('media\\:description').textContent.replace(/\n/g, '<br />');
    const videoUrl = e.querySelector('link[rel="alternate"]').getAttribute('href');
    const imageUrl = e.querySelector('media\\:thumbnail').getAttribute('url');
    const published = e.querySelector('published').textContent;
    const author = e.querySelector('author > name').textContent;

    const enclosureUrl = `${enclosurePath}?videoUrl=${encodeURIComponent(videoUrl)}`;

    // Don't know what guid has to be. Just make it unique-ish within podcastify.
    const hash = crypto.createHash('md5');
    hash.update(type + '@' + id + '@' + enclosureUrl);
    const guid = hash.digest('hex')

    return genItem({
      title, description, imageUrl, guid, author, enclosureUrl,
      link: videoUrl,
      pubDate: (new Date(published)).toUTCString(),
    });
  });

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" \
         xmlns:dc="http://purl.org/dc/elements/1.1/" \
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" \
         xmlns:content="http://purl.org/rss/1.0/modules/content/" >
      <channel>
        ${channelInfo}
        ${''.concat(...items)}
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

// Some heuristics
const chooseFormat = (formats) =>
  formats.find(f => f.mimeType.match('audio/webm') && f.audioQuality !== 'AUDIO_QUALITY_LOW') ||
  formats.find(f => f.mimeType.match('audio/webm')) ||
  formats.find(f => f.mimeType.match('audio'));

const getAudioUrl = async (videoUrl) => {
  const resp = await fetch.fetch(videoUrl);
  const text = await resp.text();
  const formats = extractFormats(text);
  const format = chooseFormat(formats);
  return format.url;
}

module.exports = { getRss, getAudioUrl };
