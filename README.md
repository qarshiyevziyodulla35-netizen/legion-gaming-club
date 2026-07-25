# PlayStation Klub — Telegram Bot

## Nima qilingan
- Klubga joy band qilish (4 konsol, 40 000 so'm/soat, 50% oldindan to'lov)
- Uyga PlayStation ijaraga buyurtma (2 konsol, 300 000 so'm/24 soat, 100% oldindan to'lov = garov)
- Telegram Mini App interfeys (public/ papkasi)
- Admin guruhga/chatga avtomatik xabar + "Tasdiqlash/Bekor qilish" tugmalari
- To'lov: mijoz chek screenshotini botga yuboradi, admin tugma bosib tasdiqlaydi
- 20 daqiqa ichida to'lov screenshoti kelmasa, band avtomatik bekor bo'ladi

## O'rnatish (server kerak, masalan VPS yoki Railway/Render)

1. Bu papkani serverga yuklang
2. `npm install` — kutubxonalarni o'rnatish
3. `.env.example` faylini `.env` deb nusxa oling va to'ldiring:
   - `BOT_TOKEN` — @BotFather orqali yangi bot yarating, tokenni oling
   - `WEB_APP_URL` — sizning domeningiz (https bo'lishi SHART, masalan Railway/Render avtomatik beradi)
   - `ADMIN_CHAT_ID` — @userinfobot ga yozib, o'z ID raqamingizni oling
4. `node index.js` — ishga tushirish

## Muhim eslatmalar
- Telegram Mini App **faqat https bilan ishlaydi** — shuning uchun bepul hosting (Railway, Render, yoki VPS + domen) kerak bo'ladi, localhost'da faqat test qilib ko'rish mumkin (Telegram tashqarisida, brauzerda)
- Ma'lumotlar hozircha oddiy `data.json` faylida saqlanadi — bu kichik boshlanish uchun yetarli, lekin buyurtmalar ko'payib ketsa, haqiqiy bazaga (Postgres) o'tish kerak bo'ladi
- Jihoz shikastlanishi/qaytmasligi bot orqali nazorat qilinmaydi — bu jismoniy shartnoma/pasport nusxasi orqali hal qilinishi kerak

## Keyingi qadamlar (hozircha qilinmagan)
- Payme/Click avtomatik to'lov integratsiyasi
- Admin uchun to'liq statistika sahifasi (hozircha faqat Telegram xabarlar orqali boshqariladi)
- Mijozning "Mening buyurtmalarim" sahifasi
