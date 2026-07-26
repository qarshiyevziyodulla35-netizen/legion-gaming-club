# PlayStation Klub — Telegram Bot

## Nima qilingan
- Klubga joy band qilish — mijoz **o'zi konsolni tanlaydi** (1-4), tanlangan konsolning band soatlari darhol ko'rinadi
- Uyga PlayStation ijaraga buyurtma — mijoz 2 ta ijara konsolidan birini tanlaydi, sanadagi band/bo'shligi ko'rinadi
- Telegram Mini App interfeys — dashboard uslubidagi dizayn
- "Mening buyurtmalarim" — telefon raqam bo'yicha qidiriladi (Telegram ID ba'zi mijozlarda ishlamasligi mumkinligi uchun ishonchli yechim)
- **Admin panel** (`/admin.html`):
  - Moliyaviy hisobot (onlayn/oflayn/jami daromad)
  - **Oflayn (joyida) bandlikni tizimga kiritish** — mijoz botsiz kelib to'lagan bo'lsa, shu yerdan kiritiladi, avtomatik "tasdiqlangan" deb belgilanadi va statistikaga qo'shiladi
  - Barcha buyurtmalar ro'yxati (onlayn/oflayn belgisi bilan)
- Admin guruhga/chatga avtomatik xabar + "Tasdiqlash/Bekor qilish" tugmalari
- To'lov: mijoz chek screenshotini botga yuboradi, admin tugma bosib tasdiqlaydi
- 20 daqiqa ichida to'lov screenshoti kelmasa, band avtomatik bekor bo'ladi
- `/stats` — statistika (onlayn/oflayn ajratilgan holda), faqat admin uchun

## O'rnatish

1. Bu papkani serverga yuklang (barcha fayllar bitta darajada, papkasiz)
2. `npm install`
3. `.env.example` faylini `.env` deb nusxa oling va to'ldiring
4. `node index.js`

## ADMIN_CHAT_ID va ADMIN_TELEGRAM_ID farqi

- **ADMIN_CHAT_ID** — yangi buyurtma xabarlari shu yerga boradi (guruh bo'lishi mumkin)
- **ADMIN_TELEGRAM_ID** — sizning shaxsiy Telegram ID'ingiz — `/admin`, `/stats` va admin panelga
  kirish huquqi shu orqali tekshiriladi

Ikkalasini ham botning shaxsiy/guruh chatida `/groupid` deb yozib bilib olasiz.

## Oflayn bandlikni kiritish

Admin panelda ("📋 Barcha buyurtmalar" — botda `/admin` deb yozing) "➕ Oflayn bandlik qo'shish"
formasi bor. Mijoz klubga kelib yoki telefon orqali botsiz band qilgan bo'lsa:
1. Turi (klub/ijara), konsol, sana, vaqt, muddatni tanlang
2. Agar standart narxdan farqli summa olingan bo'lsa, "Qabul qilingan summa" ga kiriting
3. "Qo'shish" — bandlik avtomatik "tasdiqlangan" bo'lib, statistikaga qo'shiladi

Bu orqali onlayn va oflayn daromadni birga, bitta joydan (moliya bo'limida) kuzatib borish mumkin.

## Karta raqami
`.env` fayliga `PAYMENT_CARD_NUMBER` va `PAYMENT_CARD_OWNER` qo'shing.

## Muhim eslatmalar
- Telegram Mini App **faqat https bilan ishlaydi**
- Ma'lumotlar hozircha oddiy `data.json` faylida saqlanadi
- Jihoz shikastlanishi/qaytmasligi bot orqali nazorat qilinmaydi

## Keyingi qadamlar (hozircha qilinmagan)
- Payme/Click avtomatik to'lov integratsiyasi (merchant hisob kerak)
