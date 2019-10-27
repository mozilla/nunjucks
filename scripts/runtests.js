#!/usr/bin/env node
require('regenerator-runtime/runtime');

const NYC = require('nyc');
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

const createServer = require('./testrunner/server');
const chromeRun = require('./testrunner/chrome');
const phantomjsRun = require('./testrunner/phantomjs');

const precompile = require('nunjucks/test').precompile;

const mocha = new Mocha({
  ui: 'bdd',
  timeout: 10000,
  reporter: 'spec'
});

const testDir = path.resolve(__dirname, '../tests');

fs.readdirSync(testDir).filter(f => f !== 'util.js' && f !== '.eslintrc.js' && f.indexOf('.js') !== -1).forEach(
  f => mocha.addFile(path.join(testDir, f)));

const nyc = global.nyc = new NYC({produceSourceMap: true});
nyc.reset();
nyc.wrap();

function precompileTestTemplates() {
  return new Promise((resolve, reject) => {
    try {
      const output = precompile(path.join(testDir, 'templates'), {
        include: [/\.(njk|html)$/],
      });
      fs.writeFileSync(path.join(testDir, 'browser/precompiled-templates.js'), output);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function mochaRun() {
  return new Promise((resolve, reject) => {
    try {
      mocha.run(failures => resolve(failures));
    } catch (err) {
      reject(err);
    }
  });
}

function getCoverageFilename(suffix) {
  const id = nyc.processInfo.uuid;
  return path.resolve(nyc.tempDirectory(), `${id}-${suffix}.json`);
  
}

function writeCoverage(coverage, suffix) {
  coverage = nyc.sourceMaps.remapCoverage(coverage);
  const coverageFilename = getCoverageFilename(suffix);
  fs.writeFileSync(coverageFilename, JSON.stringify(coverage), 'utf-8');
}

async function runBrowserTests(server, {isSlim} = {}) {
  const baseAddress = `http://localhost:${server.address().port}/tests/browser`;
  const address = `${baseAddress}/${isSlim ? 'slim.html' : 'index.html'}`;
  const coverageSuffix = (isSlim) ? '-slim' : '';
  const data = await chromeRun(address, {});
  await phantomjsRun(address, {
    coverageFile: getCoverageFilename(`phantomjs${coverageSuffix}`),
  });

  writeCoverage(data.coverage, `chrome${coverageSuffix}`);
}

(async function() {
  const failures = await mochaRun();
  if (failures) {
    process.exitCode = 1;
    return;
  }

  writeCoverage(global.__coverage__, 'node');

  const server = await createServer();

  try {
    await runBrowserTests(server, {isSlim: false});
    await precompileTestTemplates();
    await runBrowserTests(server, {isSlim: true});
  } catch (err) {
    server.close();
    console.error(err);
    process.exitCode = 1;
    return;
  }
  // const address = `http://localhost:${server.address().port}/tests/browser/`;

  server.close();


  nyc.writeCoverageFile();
  nyc.report();
}());
