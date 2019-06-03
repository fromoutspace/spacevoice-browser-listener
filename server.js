const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const frontPagePath = path.join(__dirname, 'client', 'index.html');
const frontPageFileContent = fs.readFileSync(frontPagePath, "utf8");
const urlToForwardCommand = process.env.commandControllerUrl || 'http://localhost:8080';
const port = process.env.thisServerPort || '3000';

const frontPageContent = frontPageFileContent.replace('#serverPortToReplace', port);

app
    .use(express.static('client'))
    .use(bodyParser.text())
    .get('/', (request, response) => response.send(frontPageContent))
    .post('/command', (request, response) => got.post(urlToForwardCommand, {body: request.body}))
    .listen(port, () => console.log(`Voice-Listener is working on http://localhost:${port}`));
