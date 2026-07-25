const { Telegraf, Markup } = require('telegraf');
const booking = require('./booking');

function createBot(token, webAppUrl, adminChatId) {
  const bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply(
      "Assalomu alaykum! 🎮 PlayStation klubga xush kelibsiz.\n\nQuyidagi tugma orqali joy band qilishingiz yoki uyga PlayStation buyurtma qilishingiz mumkin:",
      Markup.keyboard([
        [Markup.button.webApp('🎮 Band qilish / Buyurtma', webAppUrl)]
      ]).resize()
    );
  });

  // Mijoz to'lov chekini (screenshot) yuborsa — adminga forward qilinadi
  // Format: mijoz avval "/pay <kind>_<id>" yozadi yoki oddiy rasm yuborsa, oxirgi buyurtmasiga bog'lanadi (soddalashtirilgan versiya)
  bot.on('photo', async (ctx) => {
    await ctx.reply("To'lov cheki qabul qilindi ✅ Admin tekshirib, tez orada tasdiqlaydi.");
    if (adminChatId) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      await bot.telegram.sendPhoto(adminChatId, photo, {
        caption: `💳 To'lov cheki keldi.\nFoydalanuvchi: ${ctx.from.username ? '@' + ctx.from.username : ctx.from.id}\n\nBuyurtma raqamini so'rab, "✅ Tasdiqlash" tugmasini bosing.`
      }).catch(() => {});
    }
  });

  // Admin "Tasdiqlash" / "Bekor qilish" tugmalarini bosganda
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data; // masalan: confirm_club_3
    const [action, kind, idStr] = data.split('_');
    const id = Number(idStr);

    if (action === 'confirm') {
      const result = booking.confirmPayment(kind, id);
      if (result.ok) {
        await ctx.answerCbQuery('Tasdiqlandi ✅');
        await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n✅ TASDIQLANDI');
        if (result.item.telegramId) {
          bot.telegram.sendMessage(result.item.telegramId,
            `✅ Buyurtmangiz #${id} tasdiqlandi! Ko'rishguncha 🎮`).catch(() => {});
        }
      } else {
        await ctx.answerCbQuery('Xatolik: topilmadi');
      }
    } else if (action === 'cancel') {
      const result = booking.cancel(kind, id);
      if (result.ok) {
        await ctx.answerCbQuery('Bekor qilindi ❌');
        await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n❌ BEKOR QILINDI');
        if (result.item.telegramId) {
          bot.telegram.sendMessage(result.item.telegramId,
            `❌ Buyurtmangiz #${id} bekor qilindi. Savol bo'lsa, admin bilan bog'laning.`).catch(() => {});
        }
      } else {
        await ctx.answerCbQuery('Xatolik: topilmadi');
      }
    }
  });

  return bot;
}

module.exports = { createBot };
