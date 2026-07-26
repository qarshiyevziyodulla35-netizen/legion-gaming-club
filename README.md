# PlayStation Klub — Telegram Bot

## Nima qilingan
- Klubga joy band qilish — mijoz o'zi konsolni tanlaydi, band vaqtlar "(band)" deb belgilanadi
- Uyga PlayStation ijaraga buyurtma — mijoz 2 ta ijara konsolidan birini tanlaydi
- "Mening buyurtmalarim" — telefon raqam bo'yicha qidiriladi
- **Admin panel** (`/admin`, parol bilan): moliyaviy hisobot, barcha buyurtmalar, oflayn bandlik kiritish
- **Xodim sahifasi** (`/xodim`, alohida parol bilan): FAQAT oflayn bandlik kiritadi,
  statistika/buyurtmalar ro'yxatini ko'ra olmaydi
- Admin guruhga avtomatik xabar + "Tasdiqlash/Bekor qilish" tugmalari
- 20 daqiqa ichida to'lov screenshoti kelmasa, band avtomatik bekor bo'ladi

## O'rnatish

1. Bu papkani serverga yuklang (barcha fayllar bitta darajada, papkasiz)
2. `npm install`
3. `.env.example` faylini `.env` deb nusxa oling va to'ldiring
4. `node index.js`

## ‼️ MUHIM: Ma'lumotlarni yo'qotmaslik (DATA_DIR)

Railway kabi platformalarda, agar ma'lumotlar oddiy papkada saqlansa, **har safar yangi kod
deploy qilganingizda barcha mijoz ma'lumotlari o'chib ketadi** (konteyner qayta yaratiladi).

Buni oldini olish uchun:
1. Railway loyihangizga **Volume** (doimiy xotira) qo'shing — Railway paneli → loyihangiz →
   "Volumes" → "New Volume" → masalan `/data` yo'lga ulang
2. `.env`ga qo'shing: `DATA_DIR=/data`
3. Shundan keyin `data.json` shu doimiy xotirada saqlanadi, deploy qilinganda o'chmaydi

**Agar bu bosqichni o'tkazib yuborsangiz**, botni yangilashda barcha buyurtma tarixi yo'qoladi.

## Parollar

- **ADMIN_PANEL_PASSWORD** — sizning shaxsiy parolingiz, to'liq huquq: statistika, barcha
  buyurtmalar, oflayn kiritish. Faqat o'zingizda saqlang.
- **STAFF_PASSWORD** — ishchiga beriladigan parol. Bu bilan faqat oflayn bandlik kiritish
  mumkin (`/xodim` sahifasi), moliyaviy ma'lumotlar va boshqa mijozlar buyurtmalari ko'rinmaydi.

**Ishchi qanday foydalanadi:** botga `/xodim` deb yozadi → "➕ Oflayn bandlik" tugmasi chiqadi →
parolni kiritadi → klub/ijara, konsol, sana/vaqt tanlab, "Qo'shish" bosadi. Bu bandlik avtomatik
"tasdiqlangan" bo'lib hisobga qo'shiladi.

## ADMIN_CHAT_ID (guruh)

Yangi buyurtma xabarlari (tasdiqlash/bekor qilish tugmalari bilan) shu chatga boradi.
Guruh yarating, botni admin qilib qo'shing, guruhda `/groupid` deb yozib ID'sini oling,
`.env`dagi `ADMIN_CHAT_ID`ga qo'ying.

## Karta raqami
`.env` fayliga `PAYMENT_CARD_NUMBER` va `PAYMENT_CARD_OWNER` qo'shing.

## Moliyaviy hisobot
Admin panelda: klub daromadi, ijara daromadi, onlayn/oflayn ajratilgan holda, va jami daromad —
bittа joyda. `/stats` buyrug'i orqali ham bot ichida qisqacha ko'rish mumkin (faqat admin parol bilan).

## Keyingi qadamlar (hozircha qilinmagan)
- Payme/Click avtomatik to'lov integratsiyasi (merchant hisob kerak)
