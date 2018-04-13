const WebSocket = require('ws');
const PORT = process.env.PORT || 5000;
const express = require('express');

const server = express()
  .listen(PORT, () => console.log(`[INFO] Server started on port ${PORT}`));

const wss = new WebSocket.Server({ server });
const players = new Map();

// SERVER MESSAGES TO CLIENT --------

const START_GAME = { type: "SERVER_START" };
const END_GAME = { type: "SERVER_END" };
const JOIN = { type: "SERVER_JOIN" };
const UPDATE = { type: "SERVER_UPDATE" };
const FINISH = { type: "SERVER_FINISH" };
const DIE = { type: "SERVER_DIE" };

// ----------------------------------

wss.closeConnections = function close() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.terminate();
    }
  });
};

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const newPlayer = ({ name }) => {
  players.set(name, { map: 'Level1', location: [0, 0], lives: 5, score: 0 });
  wss.broadcast(JSON.stringify({ ...JOIN, name }));
};

const getPlayers = () => {
  let playerList = [];
  players.forEach((player, name) => {
    playerList.push({ name, ...player });
  });

  return playerList;
};

const startGame = () => {
  wss.broadcast(JSON.stringify(START_GAME));
};

const endGame = () => {
  wss.broadcast(JSON.stringify(END_GAME));
  wss.closeConnections();
};

const updatePlayer = ({ name, map, location, lives, score }) => {
  players.set(name, { map, location, lives, score });
  wss.broadcast(JSON.stringify({ ...UPDATE, name, map, location, lives, score }));
};

const killPlayer = ({ name }) => {
  wss.broadcast(JSON.stringify({ ...DIE, name }));
};

const finishPlayer = ({ name }) => {
  wss.broadcast(JSON.stringify({ ...FINISH, name }));
}

wss.on('connection', function connection(ws) {
  console.log("[INFO] New connection");
  let name = "";

  ws.on('message', function incoming(message) {
    const msgParsed = JSON.parse(message);
    const { type } = msgParsed;

    if (!type) {
      console.log(`[ERROR] Unknown message: ${message}`);
    }

    switch (type) {
      case "END":
        endGame();
        break;
      case "START":
        startGame();
        break;
      case "JOIN":
        name = msgParsed.name;
        newPlayer(msgParsed);
        ws.send(JSON.stringify(getPlayers()));
        break;
      case "UPDATE":
        updatePlayer(msgParsed);
        break;
      case "DIE":
        killPlayer(msgParsed);
        break;
      case "FINISH":
        finishPlayer(msgParsed);
        break;
        
      default:
        console.log(`[ERROR] Unknown type: ${type}`);
    }
  });

  ws.on('close', () => {
    console.log(`[INFO] Player ${name} quit`);
    players.delete(name);
  });
});

