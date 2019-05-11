const express = require('express');

const app = express();
const port = 3000;

app
    .use(express.static('client'))
    .get('/', (request, response) => response.sendFile('index.html'))
    .listen(port, () => console.log(`Voice-Listener is working on http://localhost:${port}`));
