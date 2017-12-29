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
  // 啟動服務
  const linebotParser = require('./LineBot/').parser();
  app.post('/', linebotParser);

  // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});
