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

  // Klubga band qilish
  app.post('/api/club-booking', (req, res) => {
    const { date, startHour, hours, phone, telegramId } = req.body;
    if (!date || startHour == null || !hours || !phone) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const result = booking.createClubBooking({ date, startHour: Number(startHour), hours: Number(hours), phone, telegramId });
    if (!result.ok) return res.status(409).json(result);

    notifyAdminNewBooking(bot, adminChatId, 'club', result.booking);
    res.json(result);
  });

  // Uyga ijara buyurtmasi
  app.post('/api/rental-order', (req, res) => {
    const { date, startHour, hours, address, phone, telegramId } = req.body;
    if (!date || startHour == null || !hours || !address || !phone) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const result = booking.createRentalOrder({ date, startHour: Number(startHour), hours: Number(hours), address, phone, telegramId });
    if (!result.ok) return res.status(409).json(result);

    notifyAdminNewBooking(bot, adminChatId, 'rental', result.order);
    res.json(result);
  });

  // Mijozning o'z buyurtmalari tarixi
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

  // Bugungi bo'sh konsollar (dashboard uchun)
  app.get('/api/availability', (req, res) => {
    res.json(booking.getTodayAvailability());
  });

  // Tanlangan sana uchun bandlik jadvali (klub: soatlik, ijara: kunlik)
  app.get('/api/schedule', (req, res) => {
    const { kind, date } = req.query;
    if (!kind || !date) return res.status(400).json({ ok: false, error: 'missing_fields' });
    if (kind === 'club') return res.json(booking.getClubSchedule(date));
    if (kind === 'rental') return res.json(booking.getRentalSchedule(date));
    res.status(400).json({ ok: false, error: 'bad_kind' });
  });

  // Admin uchun: barcha buyurtmalar (faqat admin telegramId bilan)
  app.get('/api/all-orders', (req, res) => {
    const { telegramId } = req.query;
    if (!adminTelegramId || String(telegramId) !== String(adminTelegramId)) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    res.json(booking.getAllOrders());
  });

  // Narxlarni frontendga berish
  app.get('/api/prices', (req, res) => {
    res.json({
      clubHourly: booking.CLUB_HOURLY_PRICE,
      rentalDaily: booking.RENTAL_DAILY_PRICE
    });
  });

  // Har bir konsolning hozirgi jonli holati (bosh sahifa uchun)
  app.get('/api/live-status', (req, res) => {
    res.json(booking.getLiveConsoleStatus());
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
