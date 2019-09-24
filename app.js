const express = require('express');
const morgan = require('morgan');
const router = require('./router.js');

const app = express();

if (process.env.APP_ENV !== 'test') {
  app.use(morgan('short'))
}
app.use(router);

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(':: Listening on port ', port);
  });
}
