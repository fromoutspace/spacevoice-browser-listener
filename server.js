const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const frontPagePath = path.join(__dirname, 'client', 'listener.html');
const frontPageFileContent = fs.readFileSync(frontPagePath, "utf8");
const urlToForwardCommand = process.env.commandControllerUrl || 'http://localhost:8080';
const port = process.env.thisServerPort || '3000';
const frontPageUrl = "http://localhost:" + port;
const frontPageContent = frontPageFileContent.replace('#serverPortToReplace', port);
const chromePath = process.env.chromePath || "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const doNothing = () => {
};
const browserSettings = {
    headless: false,
    args: ['--use-fake-ui-for-media-stream'],
    executablePath: chromePath
};

const browserHandler = {browser: null, shouldReopenBrowser: true};
const controller = {
    onServerStart() {
        console.log(`Voice-Listener is working on ${frontPageUrl}`);
        openBrowser();
    },
    forwardCommand(request, response) {
        const commands = request.body.commands;
        if (commands) got.post(urlToForwardCommand, {body: commands[0]}).catch(doNothing)
    },
    startBrowserRecording(request, response) {
        browserHandler.shouldReopenBrowser = true;
        openBrowser();
    },
    stopBrowserRecording(request, response) {
        let isStopped = request.body.isStopped === true;
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
