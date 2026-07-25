const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function defaultData() {
  return {
    clubConsoles: [1, 2, 3, 4],       // klubdagi 4 ta konsol
    rentalConsoles: [1, 2],           // ijaradagi 2 ta konsol
    clubBookings: [],                 // {id, consoleId, date, startHour, hours, phone, status, createdAt}
    rentalOrders: [],                 // {id, consoleId, address, date, startTime, hours, phone, status, createdAt}
    nextId: 1
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(defaultData());
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data) {
  const id = data.nextId;
  data.nextId += 1;
  return id;
}

module.exports = { load, save, nextId, DB_PATH };
