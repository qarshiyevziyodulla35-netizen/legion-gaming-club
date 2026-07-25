const express = require('express');
const path = require('path');
const booking = require('./booking');

function createServer(bot, adminChatId) {
  const app = express();
  app.use(express.json());

  // Statik sahifalar (papkasiz, hammasi bitta darajada joylashgan)
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.get('/club.html', (req, res) => res.sendFile(path.join(__dirname, 'club.html')));
  app.get('/rental.html', (req, res) => res.sendFile(path.join(__dirname, 'rental.html')));
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

  // Narxlarni frontendga berish
  app.get('/api/prices', (req, res) => {
    res.json({
      clubHourly: booking.CLUB_HOURLY_PRICE,
      rentalDaily: booking.RENTAL_DAILY_PRICE
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
