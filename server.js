const express = require('express');
const request = require('request');
const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const frontPagePath = path.join(__dirname, 'client', 'listener.html');
const frontPageFileContent = fs.readFileSync(frontPagePath, "utf8");
const urlToForwardCommand = process.env.urlToForwardCommand;
const port = process.env.thisServerPort;
const frontPageUrl = `http://localhost:${port}`;
const frontPageContent = frontPageFileContent.replace('#serverPortToReplace', port);
const chromePath = process.env.chromePath;

const browserSettings = {
    headless: false,
    args: [
        '--use-fake-ui-for-media-stream',
        '--no-sandbox',
        '--fast-start'],
    executablePath: chromePath
};

const browserHandler = {browser: null, shouldReopenBrowser: true};
const controller = {
    onServerStart() {
        console.log(`Voice-Listener is working on ${frontPageUrl}`);
        openBrowser();
    },
    forwardCommand(req, resp) {
        const commands = req.body.command || [];
        if (commands.length)
            request({
                uri: urlToForwardCommand,
                method: 'POST',
                json: {command: commands[0]}
            });
    },
    startBrowserRecording(req, resp) {
        browserHandler.shouldReopenBrowser = true;
        openBrowser();
    },
    stopBrowserRecording(req, resp) {
        let isStopped = req.body.isStopped === true;
        browserHandler.shouldReopenBrowser = isStopped === false;
        if (isStopped) browserHandler.browser.close();
    }
};

app
    .use(express.static('client'), express.json())
    .get('/', (request, response) => response.send(frontPageContent))
    .post('/command', controller.forwardCommand)
    .get('/start', controller.startBrowserRecording)
    .post('/stop', controller.stopBrowserRecording)
    .listen(port, controller.onServerStart);


async function openFrontPage(browser) {
    const page = await browser.newPage();
    await page.goto(frontPageUrl);
    page.on('close', () => openFrontPage(browser))
}

function openBrowser() {
    if (!browserHandler.shouldReopenBrowser) return;
    (async () => {
        const browser = await puppeteer.launch(browserSettings);
        browser.on('disconnected', openBrowser);
        browserHandler.browser = browser;

        await openFrontPage(browser);
    })()
}
