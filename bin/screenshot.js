#! /usr/bin/env node
/* eslint-disable no-console */

const os = require('os');
const path = require('path');
const args = require('args-parser')(process.argv);
const packageInfo = require('../package.json');
const { default: Screenshot } = require('../');

const isUrl = url => /[^\w]/g.test(url);
const urls = Object.keys(args).filter(key => isUrl(key));
const {
  width = 1366,
  height,
  type = 'png',
  quality = 100,
  dpr: deviceScaleFactor = 2,
  emulate: emulateConfig,
  waitUntil = 'networkidle2',
  disableJS = false,
  scrollToBottom,
  sleep,
  named,
  path: outputPath = './',
  version,
  selector,
  V,
} = args;

if (version || V) console.log(packageInfo.version);

function isValidLocalPath(localPath) {
  return localPath.replace(/\./g, '').indexOf('/') === 0;
}

function fileName(url) {
  let name;

  if (isValidLocalPath(url)) {
    name = `${path.basename(url, path.extname(url))}.${type}`;
  } else {
    name = `${url.replace(/http[^/]+\/\//, '').replace(/\//g, '_').replace(/\?.*/, '')}.${type}`;
  }

  if (!fileName.count) fileName.count = 0;
  if (named && named !== true) name = `${named}${fileName.count > 0 ? `_${fileName.count}` : ''}.${type}`;

  fileName.count += 1;
  return name;
}

function withOutputPath(savedName) {
  return path.join(
    outputPath.replace(/^~/, os.homedir()),
    savedName,
  );
}

function getEvaluate() {
  if (sleep) {
    return {
      func: timeout => (new Promise((resolve) => {
        setTimeout(resolve, timeout);
      })),
      args: sleep,
    };
  } else {
    return null;
  }
}

async function takeAllScreenshot(screenshot) {
  let url = urls.shift();
  try {
    if (typeof url === 'string') {
      let savedName = fileName(url);

      if (isValidLocalPath(url)) {
        url = path.isAbsolute(url) ? url : path.resolve(url);
        savedName = fileName(url);

        url = `file://${url}`;
      } else if (url.indexOf('://') === -1) {
        url = `http://${url}`;
        savedName = fileName(url);
      }

      await screenshot.init({
        evaluate: getEvaluate(),
        disableJS,
        waitUntil,
        emulateConfig,
        selector,
        screenshotConfig: Object.assign(
          { type, path: withOutputPath(savedName) },
          type === 'jpeg' ? { quality } : null, // only jpeg have quality
          height ? null : { fullPage: true }, // when height is not specified, using fullPage
        ),
      });

      console.log(`🤖  start take screenshot with ${url.path}`.data);
      await screenshot.takeScreenshot(url);
      console.log(`🎉  save ${url.path} at ${withOutputPath(savedName).info}`.data);
    }
  } catch (err) {
    console.error(`😿  cannot take screenshot with ${url.path}`.error);
    console.error(err);
  }
  if (urls.length > 0) await takeAllScreenshot(screenshot);
}

(async () => {
  const screenshot = new Screenshot({
    waitUntil: 'networkidle2',
    waitForFunction: scrollToBottom ? () => {
      if (window.page2image.scrollToBottom()) {
        return window.page2image.checkIfImageBeenLoaded();
      }
      return false;
    } : () => window.page2image.checkIfImageBeenLoaded(),
    viewportConfig: { width, height: height || 768, deviceScaleFactor },
  });
  await takeAllScreenshot(screenshot);
  process.exit(0);
})();
