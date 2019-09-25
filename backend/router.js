const express = require('express');
const lib = require('./lib.js');
const router = express.Router();

// Dirty download time optimization
// cf. https://github.com/hi-ogawa/range-split-proxy
// const RANGE_SPLIT_PROXY_URL = 'http://localhost:7070/';
const RANGE_SPLIT_PROXY_URL = 'https://range-split-proxy.herokuapp.com/';
const mkEnclosureUrl = (req) => (videoUrl) => {
  const enclosurePath = `${req.protocol}://${req.headers['host']}/enclosure`;
  const url1 = `${enclosurePath}?videoUrl=${videoUrl}`;
  const url2 = `${RANGE_SPLIT_PROXY_URL}?url=${encodeURIComponent(url1)}`;
  return url2;
}

// type: enum 'playlist', 'channel', 'user'
// id: string
const rssHandler = async (req, res) => {
  let { type, id } = req.query
  if (!(type && id)) {
    return res.status(400).send('Required parameter: type, id');
  }

  const rss = await lib.getRss(type, id, mkEnclosureUrl(req));
  if (!rss) {
    return res.status(400).send('Invalid parameter: type, id');
  }

  res.status(200)
  .set('Content-Type', 'text/xml')
  .send(rss);
};

// videoUrl: string
const enclosureHandler = async (req, res) => {
  let { videoUrl } = req.query
  if (!videoUrl) {
    return res.status(400).send('Required parameter: videoUrl');
  }

  const audioUrl = await lib.getAudioUrl(videoUrl);
  if (!audioUrl) {
    return res.status(400).send('Invalid parameter: original');
  }

  res.redirect(audioUrl);
};

router.get('/rss', rssHandler);
router.get('/enclosure', enclosureHandler);

module.exports = router;
