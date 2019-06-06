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
const doNothing = () => {
};
const broserSettings = {
    headless: false,
    args: ['--use-fake-ui-for-media-stream']
};

let shouldReopenBrowser = true;

app
    .use(express.static('client'), express.json())
    .get('/', (request, response) => response.send(frontPageContent))
    .post('/command', (request, response) => {
        const commands = request.body.commands;
        if (commands) got.post(urlToForwardCommand, {body: commands[0]}).catch(doNothing)
    })
    .listen(port, () => {
        console.log(`Voice-Listener is working on ${frontPageUrl}`);
        openBrowser();
    });


function openBrowser() {
    if (!shouldReopenBrowser) return;
    (async () => {
        const browser = await puppeteer.launch(broserSettings);
        browser.on('disconnected', openBrowser);
        const page = await browser.newPage();
        await page.goto(frontPageUrl);
    })()
}
