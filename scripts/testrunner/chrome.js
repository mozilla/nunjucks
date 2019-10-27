const puppeteer = require('puppeteer');

module.exports = async function browserRun(address, coverage) {
  console.log(`Chrome running at ${address}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(a => a.jsonValue()));
    console.log(...args);
  });

  function cleanup() {
    browser.close();
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      cleanup();
      reject(new Error('Mocha browser test timed out'));
    }, 30000);

    page.on('pageerror', (err) => {
      reject(err);
    });

    (async () => {
      try {
        await page.exposeFunction('__mochaFinish', (err, data) => {
          cleanup();
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
        await page.goto(address);
      } catch (e) {
        cleanup();
        reject(e);
      }
    })();
  });
};
