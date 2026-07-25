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

module.exports = {
  CLUB_HOURLY_PRICE, RENTAL_DAILY_PRICE,
  createClubBooking, createRentalOrder,
  confirmPayment, cancel, expireStalePayments,
  findFreeClubConsole, findFreeRentalConsole
};
