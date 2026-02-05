require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL; // или твой URL сервиса
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN is missing");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

const APPLY_URL = "https://example.com/apply";
const SUPPORT_URL = "https://t.me/your_support";

const startText =
    `Виртуальная карта для путешествий и оплаты зарубежных сервисов — за 2 минуты!

🚀 Моментальный выпуск — совершайте покупки сразу после оформления.

🌍 Оплачивайте:
• Магазины: Amazon, eBay
• Подписки: Patreon, Dropbox
• Путешествия: Booking, Airbnb, Agoda
• Покупки в 180+ странах`;

bot.start((ctx) =>
    ctx.reply(
        startText,
        Markup.inlineKeyboard([
            [Markup.button.url("🚀 Оформить карту", APPLY_URL)],
            [Markup.button.callback("💳 Тарифы", "TARIFFS"), Markup.button.callback("❓ FAQ", "FAQ")],
            [Markup.button.url("🛟 Поддержка", SUPPORT_URL)]
        ])
    )
);

bot.command("help", (ctx) =>
    ctx.reply("Команды:\n/start — главное меню\n/help — помощь")
);

bot.command("card", (ctx) =>
    ctx.reply(`Оформление карты: ${APPLY_URL}`)
);

bot.command("support", (ctx) =>
    ctx.reply(`Поддержка: ${SUPPORT_URL}`)
);

bot.action("TARIFFS", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("Тарифы:\n• Start\n• Standard\n• Premium");
});

bot.action("FAQ", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("FAQ:\n1) Выпуск: до 2 минут\n2) География: 180+ стран\n3) Подписки: да");
});

// Ловим любой текст (чтобы бот не был "пустой")
bot.on("text", (ctx) => {
    ctx.reply("Напиши /start чтобы открыть меню.");
});

bot.catch((err) => console.error("Bot error:", err));

app.get("/", (_, res) => res.send("ok"));
app.use("/telegram", bot.webhookCallback("/telegram"));

app.listen(PORT, async () => {
    console.log(`Server started on ${PORT}`);
    if (WEBHOOK_URL) {
        const hook = `${WEBHOOK_URL}/telegram`;
        await bot.telegram.setWebhook(hook, { drop_pending_updates: true });
        await bot.telegram.setMyCommands([
            { command: "start", description: "Главное меню" },
            { command: "help", description: "Помощь" },
            { command: "card", description: "Оформить карту" },
            { command: "support", description: "Поддержка" }
        ]);
        console.log("Webhook set:", hook);
    } else {
        console.log("WEBHOOK_URL not set");
    }
});
