const fs = require('fs');
const path = require('path');

// DATA_DIR beriladigan bo'lsa (masalan Railway Volume yo'li), ma'lumotlar shu yerda saqlanadi —
// bo'lmasa loyihaning o'z papkasida saqlanadi (redeploy paytida bu o'chib ketishi mumkin!)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.json');

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
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
