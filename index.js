require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL =
    process.env.WEBHOOK_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RAILWAY_STATIC_URL
        ? `https://${process.env.RAILWAY_STATIC_URL}`
        : "");

const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN is missing");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ====== НАСТРОЙ ПОД СЕБЯ ======
const APPLY_URL = "https://example.com/apply";
const SUPPORT_URL = "https://t.me/your_support";
// ==============================

const startText = `Виртуальная карта для путешествий и оплаты зарубежных сервисов — за 2 минуты!

🚀 Моментальный выпуск — совершайте покупки сразу после оформления.

🌍 Оплачивайте:
• Магазины: Amazon, eBay
• Подписки: Patreon, Dropbox
• Путешествия: Booking, Airbnb, Agoda
• Покупки в 180+ странах`;

function mainKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.url("🚀 Оформить карту", APPLY_URL)],
        [
            Markup.button.callback("💳 Тарифы", "TARIFFS"),
            Markup.button.callback("❓ FAQ", "FAQ"),
        ],
        [Markup.button.url("🛟 Поддержка", SUPPORT_URL)],
    ]);
}

bot.start((ctx) => ctx.reply(startText, mainKeyboard()));

bot.command("help", (ctx) =>
    ctx.reply("Команды:\n/start — главное меню\n/help — помощь")
);

bot.command("card", (ctx) => ctx.reply(`Оформление карты: ${APPLY_URL}`));
bot.command("support", (ctx) => ctx.reply(`Поддержка: ${SUPPORT_URL}`));

bot.action("TARIFFS", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("Тарифы:\n• Start\n• Standard\n• Premium");
});

bot.action("FAQ", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("FAQ:\n1) Выпуск: до 2 минут\n2) География: 180+ стран\n3) Подписки: да");
});

// fallback
bot.on("text", (ctx) => ctx.reply("Напиши /start чтобы открыть меню."));

bot.catch((err) => console.error("Bot error:", err));

// HTTP
app.get("/", (_, res) => res.status(200).send("ok"));
app.use(express.json());

// Диагностика входящих апдейтов
app.post(
    "/telegram",
    (req, res, next) => {
        console.log("Incoming update:", JSON.stringify(req.body).slice(0, 300));
        next();
    },
    bot.webhookCallback("/telegram")
);

async function bootstrap() {
    app.listen(PORT, async () => {
        console.log(`Server started on ${PORT}`);

        try {
            if (!WEBHOOK_URL) {
                console.error("WEBHOOK_URL is missing");
                console.error("Set WEBHOOK_URL in your hosting variables, e.g. https://your-app.up.railway.app");
                return;
            }

            const hook = `${WEBHOOK_URL}/telegram`;

            // Чистим старый webhook и ставим новый
            await bot.telegram.deleteWebhook({ drop_pending_updates: true });
            await bot.telegram.setWebhook(hook);

            // Команды в меню Telegram
            await bot.telegram.setMyCommands([
                { command: "start", description: "Главное меню" },
                { command: "help", description: "Помощь" },
                { command: "card", description: "Оформить карту" },
                { command: "support", description: "Поддержка" },
            ]);

            const info = await bot.telegram.getWebhookInfo();
            console.log("Webhook set:", hook);
            console.log("Webhook info:", info);
        } catch (e) {
            console.error("Startup error:", e.message);
        }
    });
}

bootstrap();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
