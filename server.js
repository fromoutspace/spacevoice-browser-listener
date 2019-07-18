const express = require('express');
const request = require('request');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');
const WebSocket = require('ws');
require('dotenv').config();


const app = express();
const server = http.createServer(app);

const urlToForwardCommand = process.env.urlToForwardCommand;
const thisServerPort = process.env.thisServerPort;
const chromePath = process.env.chromePath;

const frontPagePath = path.join(__dirname, 'client', 'listener.html');
const frontPageFileContent = fs.readFileSync(frontPagePath, "utf8");
const frontPageUrl = `http://localhost:${thisServerPort}`;
const frontPageContent = frontPageFileContent
    .replace('#serverPortToReplace', thisServerPort);

const browserHandler = {browser: null, shouldReopenBrowser: true};
const browserSettings = {
    headless: false,
    args: [
        '--use-fake-ui-for-media-stream',
        '--enable-speech-dispatcher',
        '--autoplay-policy=no-user-gesture-required',
        '--no-sandbox',
        '--fast-start'],
    executablePath: chromePath
};

const wsClients = {};
const wssController = {
    saveBrowserSocket(socket) {
        wsClients.browserSocket = socket;
    }
};
const wss = new WebSocket.Server({server});
wss.on('connection', wssController.saveBrowserSocket);

const serverController = {
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
    },
    sayText(req, resp) {
        if (wsClients.browserSocket)
            wsClients.browserSocket.send(req.body.text);
        resp.send('OK')
    }
};

app
    .use(express.static('client'), express.json())
    .get('/', (request, response) => response.send(frontPageContent))
    .post('/say', serverController.sayText)
    .post('/command', serverController.forwardCommand)
    .get('/start', serverController.startBrowserRecording)
    .post('/stop', serverController.stopBrowserRecording);

server.listen(thisServerPort, serverController.onServerStart);


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

