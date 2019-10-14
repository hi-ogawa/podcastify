const express = require('express');
const lib = require('./lib.js');
const router = express.Router();

const youtubeHandler = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Required parameter: url');
  }

  const youtubeEnclosureUrl = `${req.protocol}://${req.headers['host']}/youtubeEnclosure`;
  const rss = await lib.youtubeUrlToRss(url, youtubeEnclosureUrl);
  if (!rss) {
    return res.status(400).send(`Invalid url: ${url}`);
  }

  res.status(200).set('Content-Type', 'text/xml').send(rss);
}

const youtubeEnclosureHandler = async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).send('Required parameter: videoId');
  }

  const audioUrl = await lib.videoIdToAudioUrl(videoId);
  if (!audioUrl) {
    return res.status(400).send('Invalid parameter: videoId');
  }

  res.redirect(audioUrl);
}

router.get('/youtube', youtubeHandler);
router.get('/youtubeEnclosure', youtubeEnclosureHandler);

module.exports = router;
