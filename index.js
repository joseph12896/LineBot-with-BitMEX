const express = require('express');
const path = require('path');
const InitializeDatabase = require(path.resolve(__dirname, './dbs'));
const app = express();

/**
 * event of exiting
 */
process.on('SIGINT', beforeExit);
process.on('SIGTERM', beforeExit);

async function beforeExit() {
  console.log('Shutdown....');
  process.exit();
}

/**
 * InitializeDatabase
 */
InitializeDatabase(async function (dbs) {
  /**
   * 處理line message
   */
  const linebotParser = require('./LineBot/').parser();
  app.post('/linebot', linebotParser);

  /**
   * 處理檔案要求
   */
  const fileRouter = require('./File/');
  app.use('/file', fileRouter);

  /**
   * 啟動express server
   */
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});
