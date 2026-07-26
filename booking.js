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

function isActive(status) {
  return status !== 'cancelled' && status !== 'expired';
}

// ================= KLUB =================

// tanlangan konsol shu sana+vaqt oralig'ida bo'shmi
function isClubConsoleFree(date, startHour, hours, consoleId, excludeId) {
  const data = load();
  const endHour = startHour + hours;
  return !data.clubBookings.some(b =>
    b.id !== excludeId &&
    b.consoleId === consoleId &&
    b.date === date &&
    isActive(b.status) &&
    overlaps(b.startHour, b.startHour + b.hours, startHour, endHour)
  );
}

// har bir konsol uchun, tanlangan sanada qaysi soatlar band (9-22 oralig'ida)
function getClubConsoleHours(date) {
  const data = load();
  const active = data.clubBookings.filter(b => b.date === date && isActive(b.status));
  return data.clubConsoles.map(consoleId => {
    const busyHours = [];
    for (let h = 9; h <= 22; h++) {
      const busy = active.some(b => b.consoleId === consoleId && overlaps(b.startHour, b.startHour + b.hours, h, h + 1));
      if (busy) busyHours.push(h);
    }
    return { consoleId, busyHours };
  });
}

function createClubBooking({ date, startHour, hours, phone, telegramId, consoleId }) {
  const data = load();
  if (!consoleId || !data.clubConsoles.includes(Number(consoleId))) {
    return { ok: false, reason: 'console_required' };
  }
  consoleId = Number(consoleId);
  if (!isClubConsoleFree(date, startHour, hours, consoleId)) {
    return { ok: false, reason: 'console_busy' };
  }

  const total = CLUB_HOURLY_PRICE * hours;
  const prepay = Math.round(total * CLUB_PREPAY_PERCENT);

  const item = {
    id: nextId(data),
    consoleId,
    date,
    startHour,
    hours,
    phone,
    telegramId,
    total,
    prepay,
    source: 'online',
    status: 'awaiting_payment', // awaiting_payment -> confirmed -> cancelled/expired
    createdAt: Date.now()
  };
  data.clubBookings.push(item);
  save(data);
  return { ok: true, booking: item };
}

// admin tomonidan kiritiladigan oflayn (joyida to'langan) klub bandligi
function createOfflineClubBooking({ date, startHour, hours, consoleId, phone, paidAmount }) {
  const data = load();
  consoleId = Number(consoleId);
  if (!data.clubConsoles.includes(consoleId)) return { ok: false, reason: 'bad_console' };
  if (!isClubConsoleFree(date, startHour, hours, consoleId)) return { ok: false, reason: 'console_busy' };

  const total = paidAmount != null && paidAmount !== '' ? Number(paidAmount) : CLUB_HOURLY_PRICE * hours;
  const item = {
    id: nextId(data),
    consoleId,
    date,
    startHour,
    hours,
    phone: phone || 'Oflayn mijoz',
    telegramId: null,
    total,
    prepay: total,
    source: 'offline',
    status: 'confirmed',
    createdAt: Date.now()
  };
  data.clubBookings.push(item);
  save(data);
  return { ok: true, booking: item };
}

// ================= IJARA =================

function isRentalConsoleFree(date, startHour, hours, consoleId, excludeId) {
  const data = load();
  const endHour = startHour + hours;
  return !data.rentalOrders.some(o =>
    o.id !== excludeId &&
    o.consoleId === consoleId &&
    isActive(o.status) &&
    (() => {
      const start = new Date(o.date + 'T00:00:00');
      start.setHours(o.startHour);
      const end = start.getTime() + o.hours * 3600 * 1000;
      const reqStart = new Date(date + 'T00:00:00');
      reqStart.setHours(startHour);
      const reqEnd = reqStart.getTime() + hours * 3600 * 1000;
      return reqStart.getTime() < end && start.getTime() < reqEnd;
    })()
  );
}

// har bir ijara konsoli tanlangan sanada band/bo'sh
function getRentalConsoleAvailability(date) {
  const data = load();
  const active = data.rentalOrders.filter(o => isActive(o.status));
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

function createRentalOrder({ date, startHour, hours, address, phone, telegramId, consoleId }) {
  const data = load();
  if (!consoleId || !data.rentalConsoles.includes(Number(consoleId))) {
    return { ok: false, reason: 'console_required' };
  }
  consoleId = Number(consoleId);
  if (!isRentalConsoleFree(date, startHour, hours, consoleId)) {
    return { ok: false, reason: 'console_busy' };
  }

  const days = Math.max(1, Math.ceil(hours / 24));
  const total = RENTAL_DAILY_PRICE * days;
  const prepay = Math.round(total * RENTAL_PREPAY_PERCENT); // to'liq oldindan = garov vazifasini ham bajaradi

  const item = {
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
    source: 'online',
    status: 'awaiting_payment',
    createdAt: Date.now()
  };
  data.rentalOrders.push(item);
  save(data);
  return { ok: true, order: item };
}

// admin tomonidan kiritiladigan oflayn ijara buyurtmasi
function createOfflineRentalOrder({ date, startHour, hours, consoleId, address, phone, paidAmount }) {
  const data = load();
  consoleId = Number(consoleId);
  if (!data.rentalConsoles.includes(consoleId)) return { ok: false, reason: 'bad_console' };
  if (!isRentalConsoleFree(date, startHour, hours, consoleId)) return { ok: false, reason: 'console_busy' };

  const days = Math.max(1, Math.ceil(hours / 24));
  const total = paidAmount != null && paidAmount !== '' ? Number(paidAmount) : RENTAL_DAILY_PRICE * days;

  const item = {
    id: nextId(data),
    consoleId,
    date,
    startHour,
    hours,
    address: address || 'Oflayn',
    phone: phone || 'Oflayn mijoz',
    telegramId: null,
    total,
    prepay: total,
    source: 'offline',
    status: 'confirmed',
    createdAt: Date.now()
  };
  data.rentalOrders.push(item);
  save(data);
  return { ok: true, order: item };
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

// mijozning barcha buyurtmalari (telefon raqam bo'yicha — Telegram ID ishlamagan holatlar uchun)
function getOrdersByPhone(phone) {
  const data = load();
  const normalize = p => String(p).replace(/[^0-9]/g, '');
  const target = normalize(phone);
  return {
    club: data.clubBookings.filter(b => normalize(b.phone) === target),
    rental: data.rentalOrders.filter(o => normalize(o.phone) === target)
  };
}

// admin uchun umumiy statistika (online/offline ajratilgan holda)
function getStats() {
  const data = load();
  const confirmedClub = data.clubBookings.filter(b => b.status === 'confirmed');
  const confirmedRental = data.rentalOrders.filter(o => o.status === 'confirmed');
  const sum = arr => arr.reduce((s, x) => s + x.total, 0);
  const bySource = (arr, src) => arr.filter(x => (x.source || 'online') === src);

  const allConfirmed = [...confirmedClub, ...confirmedRental];

  return {
    clubBookingsTotal: data.clubBookings.length,
    clubConfirmed: confirmedClub.length,
    clubRevenue: sum(confirmedClub),
    rentalOrdersTotal: data.rentalOrders.length,
    rentalConfirmed: confirmedRental.length,
    rentalRevenue: sum(confirmedRental),
    awaitingPayment:
      data.clubBookings.filter(b => b.status === 'awaiting_payment').length +
      data.rentalOrders.filter(o => o.status === 'awaiting_payment').length,
    onlineRevenue: sum(bySource(allConfirmed, 'online')),
    offlineRevenue: sum(bySource(allConfirmed, 'offline')),
    totalRevenue: sum(allConfirmed)
  };
}

// admin uchun: barcha buyurtmalar (klub + ijara)
function getAllOrders() {
  const data = load();
  return { club: data.clubBookings, rental: data.rentalOrders };
}

module.exports = {
  CLUB_HOURLY_PRICE, RENTAL_DAILY_PRICE,
  createClubBooking, createRentalOrder,
  createOfflineClubBooking, createOfflineRentalOrder,
  confirmPayment, cancel, expireStalePayments,
  getClubConsoleHours, getRentalConsoleAvailability,
  getOrdersByTelegramId, getOrdersByPhone,
  getStats, getAllOrders
};
