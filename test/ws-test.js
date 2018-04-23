const expect = require('chai').expect;
const chai = require('chai');
const chaiPromises = require('chai-as-promised');
const WebSocket = require('ws');
const index = require('../index.js');

describe('Websocket interface', () => {

  let socket;

  before((done) => {
    chai.should();
    chai.use(chaiPromises);
    socket = new WebSocket('ws://localhost:5000');
    socket.setMaxListeners(40);
    socket.on('open', () => done());
  });

  after(() => {
    socket.close();
    process.exit();
  });

  it('should return one player on JOIN', (done) => {
    const player1 = { type: "JOIN", name: "Luke" };
    socket.on('message', (msg) => {
      msg = JSON.parse(msg);
      if (!msg.type && msg.length === 1) {
        done();
      }
      socket.on('message', () => {});
    });

    socket.send(JSON.stringify(player1));    
  });

  it('should broadcast player UPDATE', () => {
    const playerUpdate = {"type":"UPDATE", "name": "Luke", "map": "Level2", "location": [0,0], "lives": 4, "score": 100 };
    const observed = gotMessage(socket).then((msg) => JSON.parse(msg).score);
    const expected = 100;
    socket.send(JSON.stringify(playerUpdate));
    return observed.should.eventually.equal(expected);
  });

  it('should broadcast player DIE', () => {
    const playerDie = { type: "DIE", name: "Luke" };
    const observed = gotMessage(socket).then((msg) => JSON.parse(msg).type);
    const expected = "SERVER_DIE";
    socket.send(JSON.stringify(playerDie));
    return observed.should.eventually.equal(expected);
  });

  it('should broadcast player FINISH', () => {
    const playerFinish = { type: "FINISH", name: "Luke" };
    const observed = gotMessage(socket).then((msg) => JSON.parse(msg).type);
    const expected = "SERVER_FINISH";
    socket.send(JSON.stringify(playerFinish));
    return observed.should.eventually.equal(expected);
  });

  it('should broadcast player FINISH', () => {
    const playerFinish = { type: "FINISH", name: "Luke" };
    const observed = gotMessage(socket).then((msg) => JSON.parse(msg).type);
    const expected = "SERVER_FINISH";
    socket.send(JSON.stringify(playerFinish));
    return observed.should.eventually.equal(expected);
  });

  it('should broadcast START', () => {
    const start = { type: "START" };
    const observed = gotMessage(socket).then((msg) => JSON.parse(msg).type);
    const expected = "SERVER_START";
    socket.send(JSON.stringify(start));
    return observed.should.eventually.equal(expected);
  });

  it('should terminate connection if joining with existing name', (done) => {
    const player = { type: "JOIN", name: "Luke" };
    socket.send(JSON.stringify(player));
    socket.on('close', () => done());
  });
});

const gotMessage = (socket) =>
  new Promise((resolve, reject) => {
    socket.on('message', (message) => resolve(message));
    socket.on('error', (error) => reject(error));
});