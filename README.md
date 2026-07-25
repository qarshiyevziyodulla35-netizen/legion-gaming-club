# PlayStation Klub — Telegram Bot

## Nima qilingan
- Klubga joy band qilish (4 konsol, 40 000 so'm/soat, 50% oldindan to'lov)
- Uyga PlayStation ijaraga buyurtma (2 konsol, 300 000 so'm/24 soat, 100% oldindan to'lov = garov)
- Telegram Mini App interfeys — dashboard uslubidagi dizayn
- "Mening buyurtmalarim" — mijoz o'z buyurtmalari tarixini ko'radi
- **Admin panel** (`/admin.html`) — barcha buyurtmalarni (klub + ijara) filtrlab ko'rish
- **Bandlik jadvali** — band qilish sahifasida tanlangan sanadagi bo'sh/band soatlar (klub) yoki bo'sh konsollar soni (ijara) ko'rsatiladi
- Admin guruhga/chatga avtomatik xabar + "Tasdiqlash/Bekor qilish" tugmalari
- To'lov: mijoz chek screenshotini botga yuboradi, admin tugma bosib tasdiqlaydi
- 20 daqiqa ichida to'lov screenshoti kelmasa, band avtomatik bekor bo'ladi
- `/stats` — umumiy statistika (faqat admin uchun)

## O'rnatish

1. Bu papkani serverga yuklang (barcha fayllar bitta darajada, papkasiz)
2. `npm install`
3. `.env.example` faylini `.env` deb nusxa oling va to'ldiring (pastdagi bo'limga qarang)
4. `node index.js`

## ADMIN_CHAT_ID va ADMIN_TELEGRAM_ID farqi

- **ADMIN_CHAT_ID** — yangi buyurtma xabarlari shu yerga boradi. Bu alohida GURUH bo'lishi mumkin
  (bir nechta xodim birga ko'rib, tasdiqlashi uchun qulay).
- **ADMIN_TELEGRAM_ID** — sizning shaxsiy Telegram ID raqamingiz. `/admin` va `/stats` buyruqlari,
  hamda admin panelga (`/admin.html`) kirish huquqi shu ID orqali tekshiriladi.

**Guruh ID'sini bilish uchun:**
1. Telegram'da yangi guruh yarating (masalan "PS Klub buyurtmalari")
2. Botni guruhga qo'shing va **admin** qiling (xabar yuborishi va tugma bosishi uchun)
3. Guruhda `/groupid` deb yozing — bot guruhning ID raqamini yuboradi (odatda `-100...` bilan boshlanadi)
4. Shu raqamni `ADMIN_CHAT_ID` ga qo'ying

**Shaxsiy ID'ingizni bilish uchun:** botning shaxsiy chatida (guruhda emas) `/groupid` deb yozing —
u sizning shaxsiy ID raqamingizni beradi. Shuni `ADMIN_TELEGRAM_ID` ga qo'ying.

## Admin panelga kirish

Botning shaxsiy chatida `/admin` deb yozing — "📋 Barcha buyurtmalar" tugmasi chiqadi,
bosilganda barcha klub va ijara buyurtmalarini (holati bilan) ko'rsatadigan sahifa ochiladi.

## Bandlikni ko'rish

- **Klub sahifasida**: sana tanlaganda, qaysi soatlar band ekanligi avtomatik ko'rsatiladi,
  band soatlar tanlash ro'yxatida "(band)" deb belgilanadi va tanlab bo'lmaydi.
- **Ijara sahifasida**: sana tanlaganda, o'sha kunga nechta konsol bo'sh ekanligi yozib chiqadi.

## Muhim eslatmalar
- Telegram Mini App **faqat https bilan ishlaydi**
- Ma'lumotlar hozircha oddiy `data.json` faylida saqlanadi — kichik boshlanish uchun yetarli
- Jihoz shikastlanishi/qaytmasligi bot orqali nazorat qilinmaydi — jismoniy shartnoma orqali hal qilinadi

## Keyingi qadamlar (hozircha qilinmagan)
- Payme/Click avtomatik to'lov integratsiyasi (merchant hisob kerak)
