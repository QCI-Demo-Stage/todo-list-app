'use strict';

const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;

createApp()
  .then((app) => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Listening on port ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
