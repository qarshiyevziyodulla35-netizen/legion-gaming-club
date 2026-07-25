const { load, save, nextId } = require('./db');

const CLUB_HOURLY_PRICE = 40000;      // so'm / soat
const RENTAL_DAILY_PRICE = 300000;    // so'm / 24 soat
const CLUB_PREPAY_PERCENT = 0.5;      // 50%
const RENTAL_PREPAY_PERCENT = 1.0;    // 100% (bekor qilmaslik uchun garov)
const PAYMENT_CONFIRM_WINDOW_MIN = 20; // to'lov kutish vaqti (daqiqa)

// --- yordamchi: vaqt oralig'i kesishishini tekshirish ---
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ================= KLUB =================

function findFreeClubConsole(date, startHour, hours) {
  const data = load();
  const endHour = startHour + hours;
  const busyConsoleIds = new Set(
    data.clubBookings
      .filter(b => b.date === date && b.status !== 'cancelled' && b.status !== 'expired')
      .filter(b => overlaps(b.startHour, b.startHour + b.hours, startHour, endHour))
      .map(b => b.consoleId)
  );
  return data.clubConsoles.find(id => !busyConsoleIds.has(id)) || null;
}

function createClubBooking({ date, startHour, hours, phone, telegramId }) {
  const data = load();
  const consoleId = findFreeClubConsole(date, startHour, hours);
  if (!consoleId) return { ok: false, reason: 'no_free_console' };

  const total = CLUB_HOURLY_PRICE * hours;
  const prepay = Math.round(total * CLUB_PREPAY_PERCENT);

  const booking = {
    id: nextId(data),
    consoleId,
    date,
    startHour,
    hours,
    phone,
    telegramId,
    total,
    prepay,
    status: 'awaiting_payment', // awaiting_payment -> confirmed -> cancelled/expired
    createdAt: Date.now()
  };
  data.clubBookings.push(booking);
  save(data);
  return { ok: true, booking };
}

// ================= IJARA =================

function findFreeRentalConsole(date, startHour, hours) {
  const data = load();
  const endHour = startHour + hours;
  const busyConsoleIds = new Set(
    data.rentalOrders
      .filter(o => o.date === date && o.status !== 'cancelled' && o.status !== 'expired')
      .filter(o => overlaps(o.startHour, o.startHour + o.hours, startHour, endHour))
      .map(o => o.consoleId)
  );
  return data.rentalConsoles.find(id => !busyConsoleIds.has(id)) || null;
}

function createRentalOrder({ date, startHour, hours, address, phone, telegramId }) {
  const data = load();
  const consoleId = findFreeRentalConsole(date, startHour, hours);
  if (!consoleId) return { ok: false, reason: 'no_free_console' };

  const days = Math.max(1, Math.ceil(hours / 24));
  const total = RENTAL_DAILY_PRICE * days;
  const prepay = Math.round(total * RENTAL_PREPAY_PERCENT); // to'liq oldindan = garov vazifasini ham bajaradi

  const order = {
    id: nextId(data),
    consoleId,
    date,
    startHour,
    hours,
    address,
    phone,
    telegramId,
    total,
    prepay,
    status: 'awaiting_payment',
    createdAt: Date.now()
  };
  data.rentalOrders.push(order);
  save(data);
  return { ok: true, order };
}

// ================= UMUMIY =================

function confirmPayment(kind, id) {
  const data = load();
  const list = kind === 'club' ? data.clubBookings : data.rentalOrders;
  const item = list.find(x => x.id === id);
  if (!item) return { ok: false, reason: 'not_found' };
  item.status = 'confirmed';
  save(data);
  return { ok: true, item };
}

function cancel(kind, id) {
  const data = load();
  const list = kind === 'club' ? data.clubBookings : data.rentalOrders;
  const item = list.find(x => x.id === id);
  if (!item) return { ok: false, reason: 'not_found' };
  item.status = 'cancelled';
  save(data);
  return { ok: true, item };
}

// to'lov screenshot yubormagan (awaiting_payment holatida qolgan) eski bandlarni bo'shatish
function expireStalePayments() {
  const data = load();
  const cutoff = Date.now() - PAYMENT_CONFIRM_WINDOW_MIN * 60 * 1000;
  let changed = false;
  for (const list of [data.clubBookings, data.rentalOrders]) {
    for (const item of list) {
      if (item.status === 'awaiting_payment' && item.createdAt < cutoff) {
        item.status = 'expired';
        changed = true;
      }
    }
  }
  if (changed) save(data);
}

// mijozning barcha buyurtmalari (telegramId bo'yicha)
function getOrdersByTelegramId(telegramId) {
  const data = load();
  const id = String(telegramId);
  return {
    club: data.clubBookings.filter(b => String(b.telegramId) === id),
    rental: data.rentalOrders.filter(o => String(o.telegramId) === id)
  };
}

// bugungi bo'sh konsollar soni (dashboard uchun)
function getTodayAvailability() {
  const data = load();
  const today = new Date().toISOString().slice(0, 10);
  const busyClub = new Set(
    data.clubBookings.filter(b => b.date === today && !['cancelled', 'expired'].includes(b.status)).map(b => b.consoleId)
  );
  const busyRental = new Set(
    data.rentalOrders.filter(o => o.date === today && !['cancelled', 'expired'].includes(o.status)).map(o => o.consoleId)
  );
  return {
    totalClub: data.clubConsoles.length,
    freeClub: data.clubConsoles.filter(id => !busyClub.has(id)).length,
    totalRental: data.rentalConsoles.length,
    freeRental: data.rentalConsoles.filter(id => !busyRental.has(id)).length
  };
}

// admin uchun umumiy statistika
function getStats() {
  const data = load();
  const confirmedClub = data.clubBookings.filter(b => b.status === 'confirmed');
  const confirmedRental = data.rentalOrders.filter(o => o.status === 'confirmed');
  const sum = arr => arr.reduce((s, x) => s + x.total, 0);

  return {
    clubBookingsTotal: data.clubBookings.length,
    clubConfirmed: confirmedClub.length,
    clubRevenue: sum(confirmedClub),
    rentalOrdersTotal: data.rentalOrders.length,
    rentalConfirmed: confirmedRental.length,
    rentalRevenue: sum(confirmedRental),
    awaitingPayment:
      data.clubBookings.filter(b => b.status === 'awaiting_payment').length +
      data.rentalOrders.filter(o => o.status === 'awaiting_payment').length
  };
}

// klub jadvali: har bir soat uchun nechta konsol bo'sh (9:00-22:00)
function getClubSchedule(date) {
  const data = load();
  const active = data.clubBookings.filter(b => b.date === date && !['cancelled', 'expired'].includes(b.status));
  const hoursArr = [];
  for (let h = 9; h <= 22; h++) {
    const busy = new Set(
      active.filter(b => overlaps(b.startHour, b.startHour + b.hours, h, h + 1)).map(b => b.consoleId)
    );
    hoursArr.push({ hour: h, free: data.clubConsoles.length - busy.size, total: data.clubConsoles.length });
  }
  return hoursArr;
}

// ijara jadvali: tanlangan sanada har bir ijara konsoli band/bo'sh
function getRentalSchedule(date) {
  const data = load();
  const active = data.rentalOrders.filter(o => !['cancelled', 'expired'].includes(o.status));
  const checkMoment = new Date(date + 'T12:00:00').getTime();

  return data.rentalConsoles.map(consoleId => {
    const busyOrder = active.find(o => {
      if (o.consoleId !== consoleId) return false;
      const start = new Date(o.date + 'T00:00:00');
      start.setHours(o.startHour);
      const end = start.getTime() + o.hours * 3600 * 1000;
      return checkMoment >= start.getTime() && checkMoment <= end;
    });
    return { consoleId, busy: !!busyOrder };
  });
}

// admin uchun: barcha buyurtmalar (klub + ijara)
function getAllOrders() {
  const data = load();
  return { club: data.clubBookings, rental: data.rentalOrders };
}

// har bir konsolning HOZIRGI (shu daqiqadagi) holati — bosh sahifa uchun
function getLiveConsoleStatus() {
  const data = load();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowHour = now.getHours() + now.getMinutes() / 60;

  const club = data.clubConsoles.map(id => {
    const active = data.clubBookings.find(b =>
      b.consoleId === id && b.date === today && !['cancelled', 'expired'].includes(b.status) &&
      nowHour >= b.startHour && nowHour < b.startHour + b.hours
    );
    return { consoleId: id, busy: !!active };
  });

  const rental = data.rentalConsoles.map(id => {
    const active = data.rentalOrders.find(o => {
      if (o.consoleId !== id || ['cancelled', 'expired'].includes(o.status)) return false;
      const start = new Date(o.date + 'T00:00:00');
      start.setHours(o.startHour);
      const end = start.getTime() + o.hours * 3600 * 1000;
      return now.getTime() >= start.getTime() && now.getTime() <= end;
    });
    return { consoleId: id, busy: !!active };
  });

  return { club, rental };
}

module.exports = {
  CLUB_HOURLY_PRICE, RENTAL_DAILY_PRICE,
  createClubBooking, createRentalOrder,
  confirmPayment, cancel, expireStalePayments,
  findFreeClubConsole, findFreeRentalConsole,
  getOrdersByTelegramId, getTodayAvailability, getStats,
  getClubSchedule, getRentalSchedule, getAllOrders,
  getLiveConsoleStatus
};
