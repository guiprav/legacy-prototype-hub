let express = require('express');
let expressWs = require('express-ws');
let fs = require('fs');
let { applyPatches } = require('immer');

let stateFilePath = './state.json';

let app = express();
expressWs(app);

let clients = new Set();
let state = {};

try {
  state = JSON.parse(fs.readFileSync(stateFilePath, { encoding: 'utf-8' }));
}
catch (err) {
  if (err.code !== 'ENOENT') {
    console.error(err);
    process.exit(1);
  }
}

app.ws('/', ws => {
  clients.add(ws);

  ws.addEventListener('close', () => {
    clients.delete(ws);
  });

  ws.addEventListener('error', err => {
    clients.delete(ws);
    console.error(err);
  });

  ws.send(JSON.stringify(state));
});

app.use(express.static('.'));
app.use(express.json());

app.patch('/', async (req, res) => {
  try {
    state = applyPatches(state, req.body);

    let jsonState = JSON.stringify(state);

    await new Promise((resolve, reject) => {
      fs.writeFile(stateFilePath, jsonState, err => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    for (let ws of clients) {
      ws.send(jsonState);
    }

    res.set('Content-Type', 'application/json');
    res.send(jsonState);
  }
  catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

let port = process.env.PORT || 3000;

app.listen(port);
console.log(`Listening on ${port}.`);
