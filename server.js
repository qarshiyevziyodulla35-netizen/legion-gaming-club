const express = require('express');
const path = require('path');
const booking = require('./booking');

function createServer(bot, adminChatId, adminTelegramId, paymentCard) {
  const app = express();
  app.use(express.json());

  // Statik sahifalar (papkasiz, hammasi bitta darajada joylashgan)
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.get('/club.html', (req, res) => res.sendFile(path.join(__dirname, 'club.html')));
  app.get('/rental.html', (req, res) => res.sendFile(path.join(__dirname, 'rental.html')));
  app.get('/orders.html', (req, res) => res.sendFile(path.join(__dirname, 'orders.html')));
  app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
  app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));

  function isAdmin(telegramId) {
    return adminTelegramId && String(telegramId) === String(adminTelegramId);
  }

  // Klubga band qilish (mijoz o'zi konsol tanlaydi)
  app.post('/api/club-booking', (req, res) => {
    const { date, startHour, hours, phone, telegramId, consoleId } = req.body;
    if (!date || startHour == null || !hours || !phone || !consoleId) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const result = booking.createClubBooking({ date, startHour: Number(startHour), hours: Number(hours), phone, telegramId, consoleId });
    if (!result.ok) return res.status(409).json(result);

    notifyAdminNewBooking(bot, adminChatId, 'club', result.booking);
    res.json(result);
  });

  // Uyga ijara buyurtmasi (mijoz o'zi konsol tanlaydi)
  app.post('/api/rental-order', (req, res) => {
    const { date, startHour, hours, address, phone, telegramId, consoleId } = req.body;
    if (!date || startHour == null || !hours || !address || !phone || !consoleId) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const result = booking.createRentalOrder({ date, startHour: Number(startHour), hours: Number(hours), address, phone, telegramId, consoleId });
    if (!result.ok) return res.status(409).json(result);

    notifyAdminNewBooking(bot, adminChatId, 'rental', result.order);
    res.json(result);
  });

  // Admin uchun: oflaynda (joyida) qilingan bandlikni tizimga kiritish
  app.post('/api/offline-booking', (req, res) => {
    const { telegramId, kind, date, startHour, hours, consoleId, phone, address, paidAmount } = req.body;
    if (!isAdmin(telegramId)) return res.status(403).json({ ok: false, error: 'forbidden' });
    if (!kind || !date || startHour == null || !hours || !consoleId) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const params = { date, startHour: Number(startHour), hours: Number(hours), consoleId, phone, paidAmount };
    const result = kind === 'club'
      ? booking.createOfflineClubBooking(params)
      : booking.createOfflineRentalOrder({ ...params, address });
    if (!result.ok) return res.status(409).json(result);
    res.json(result);
  });

  // Mijozning o'z buyurtmalari tarixi (Telegram ID bo'yicha)
  app.get('/api/my-orders', (req, res) => {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ ok: false, error: 'missing_telegramId' });
    res.json(booking.getOrdersByTelegramId(telegramId));
  });

  // Telefon raqam bo'yicha qidirish (Telegram ID ishlamagan holatlar uchun ishonchli yechim)
  app.get('/api/my-orders-by-phone', (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ ok: false, error: 'missing_phone' });
    res.json(booking.getOrdersByPhone(phone));
  });

  // Klub: tanlangan sanada har bir konsolning band soatlari
  app.get('/api/club-console-hours', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ ok: false, error: 'missing_date' });
    res.json(booking.getClubConsoleHours(date));
  });

  // Ijara: tanlangan sanada har bir konsolning band/bo'shligi
  app.get('/api/rental-console-availability', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ ok: false, error: 'missing_date' });
    res.json(booking.getRentalConsoleAvailability(date));
  });

  // Admin uchun: barcha buyurtmalar (faqat admin telegramId bilan)
  app.get('/api/all-orders', (req, res) => {
    const { telegramId } = req.query;
    if (!isAdmin(telegramId)) return res.status(403).json({ ok: false, error: 'forbidden' });
    res.json(booking.getAllOrders());
  });

  // Admin uchun: moliyaviy statistika
  app.get('/api/stats', (req, res) => {
    const { telegramId } = req.query;
    if (!isAdmin(telegramId)) return res.status(403).json({ ok: false, error: 'forbidden' });
    res.json(booking.getStats());
  });

  // Narxlarni frontendga berish
  app.get('/api/prices', (req, res) => {
    res.json({
      clubHourly: booking.CLUB_HOURLY_PRICE,
      rentalDaily: booking.RENTAL_DAILY_PRICE
    });
  });

  // To'lov uchun karta ma'lumotlari (frontendga)
  app.get('/api/payment-info', (req, res) => {
    res.json({
      cardNumber: paymentCard && paymentCard.number || '',
      cardOwner: paymentCard && paymentCard.owner || ''
    });
  });

  return app;
}

function notifyAdminNewBooking(bot, adminChatId, kind, item) {
  if (!bot || !adminChatId) return;
  const label = kind === 'club' ? 'KLUB' : 'IJARA (uyga)';
  const text = kind === 'club'
    ? `🆕 Yangi ${label} bandligi #${item.id}\nSana: ${item.date}\nVaqt: ${item.startHour}:00, ${item.hours} soat\nKonsol: #${item.consoleId}\nTelefon: ${item.phone}\nJami: ${item.total.toLocaleString()} so'm\nOldindan to'lov: ${item.prepay.toLocaleString()} so'm\nHolat: to'lov screenshoti kutilmoqda`
    : `🆕 Yangi ${label} buyurtmasi #${item.id}\nSana: ${item.date}\nVaqt: ${item.startHour}:00, ${item.hours} soat\nManzil: ${item.address}\nKonsol: #${item.consoleId}\nTelefon: ${item.phone}\nJami: ${item.total.toLocaleString()} so'm\nOldindan to'lov (garov): ${item.prepay.toLocaleString()} so'm\nHolat: to'lov screenshoti kutilmoqda`;

  bot.telegram.sendMessage(adminChatId, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Tasdiqlash', callback_data: `confirm_${kind}_${item.id}` },
        { text: '❌ Bekor qilish', callback_data: `cancel_${kind}_${item.id}` }
      ]]
    }
  }).catch(() => {});
}

module.exports = { createServer };
