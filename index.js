require('dotenv').config();
const { createBot } = require('./bot');
const { createServer } = require('./server');
const booking = require('./booking');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL; // masalan: https://sizning-domen.uz
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // xabarlar shu yerga boradi (guruh yoki shaxsiy chat)
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID; // sizning shaxsiy Telegram ID'ingiz (/admin panelga kirish uchun)
const PAYMENT_CARD_NUMBER = process.env.PAYMENT_CARD_NUMBER || '';
const PAYMENT_CARD_OWNER = process.env.PAYMENT_CARD_OWNER || '';
const ADMIN_PANEL_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || '';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || '';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('XATO: .env faylida BOT_TOKEN ko\'rsatilmagan');
  process.exit(1);
}
if (!WEB_APP_URL) {
  console.error('XATO: .env faylida WEB_APP_URL ko\'rsatilmagan (https bo\'lishi shart)');
  process.exit(1);
}
if (!PAYMENT_CARD_NUMBER) {
  console.warn('OGOHLANTIRISH: PAYMENT_CARD_NUMBER kiritilmagan — mijozlar to\'lov uchun karta raqamini ko\'rmaydi!');
}
if (!ADMIN_PANEL_PASSWORD) {
  console.warn('OGOHLANTIRISH: ADMIN_PANEL_PASSWORD kiritilmagan — admin panelga hech kim kira olmaydi!');
}
if (!STAFF_PASSWORD) {
  console.warn('OGOHLANTIRISH: STAFF_PASSWORD kiritilmagan — xodim faqat admin parol bilan oflayn bandlik kirita oladi');
}

const bot = createBot(BOT_TOKEN, WEB_APP_URL, ADMIN_CHAT_ID, ADMIN_TELEGRAM_ID);
const app = createServer(bot, ADMIN_CHAT_ID, ADMIN_TELEGRAM_ID, { number: PAYMENT_CARD_NUMBER, owner: PAYMENT_CARD_OWNER }, ADMIN_PANEL_PASSWORD, STAFF_PASSWORD);

app.listen(PORT, () => {
  console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});

bot.launch();
console.log('Telegram bot ishga tushdi');

// har 5 daqiqada to'lov qilinmagan eski bandlarni bo'shatib turadi
setInterval(() => booking.expireStalePayments(), 5 * 60 * 1000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
