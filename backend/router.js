const express = require('express');
const lib = require('./lib.js');
const router = express.Router();

// type: enum 'playlist', 'channel', 'user'
// id: string
const rssHandler = async (req, res) => {
  let { type, id } = req.query
  if (!(type && id)) {
    return res.status(400).send('Required parameter: type, id');
  }

  const enclosurePath = `${req.protocol}://${req.headers['host']}/enclosure`;
  const rss = await lib.getRss(type, id, enclosurePath);
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
