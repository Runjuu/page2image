const Screenshot = require('../').default;

const screenshot = new Screenshot({
  waitUntil: 'networkidle2',
  waitForFunction: function waitForFunction() {
    window.imageList = window.imageList || Array.from(document.getElementsByTagName('img'));

    return window.imageList.length <= window.imageList.reduce((loaded, imageElm) => (
      imageElm.complete ? loaded + 1 : loaded
    ), 0);
  },
  viewportConfig: { width: 1920, height: 1080 },
  screenshotConfig: { fullPage: true, path: 'screenshot.png' },
  launchConfig: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  },
});

screenshot
  .takeScreenshot('https://github.com/Runjuu')
  .then(process.exit);
