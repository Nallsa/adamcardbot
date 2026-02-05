require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL; // Render задает автоматически
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing");

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ====== НАСТРОЙ ПОД СЕБЯ ======
const SUPPORT_URL = "https://t.me/your_support";
const APPLY_URL = "https://example.com/apply";
// ==============================

const startText = `
<b>Виртуальная карта для путешествий и оплаты зарубежных сервисов — за 2 минуты!</b>

🚀 <b>Моментальный выпуск</b> — совершайте покупки сразу после оформления.

🌍 <b>Оплачивайте:</b>
• Магазины: Amazon, eBay
• Подписки: Patreon, Dropbox
• Путешествия: Booking, Airbnb, Agoda
• Покупки в 180+ странах
`.trim();

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

bot.start((ctx) => ctx.replyWithHTML(startText, mainKeyboard()));

bot.command("help", (ctx) =>
    ctx.reply(
        "Команды:\n/start — главное меню\n/help — помощь\n\nИспользуй кнопки под сообщением."
    )
);

bot.action("TARIFFS", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
        "💳 Тарифы:\n• Start\n• Standard\n• Premium\n\nНапиши в поддержку — поможем подобрать лучший вариант.",
        Markup.inlineKeyboard([[Markup.button.url("🛟 Поддержка", SUPPORT_URL)]])
    );
});

bot.action("FAQ", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
        "❓ FAQ:\n1) Сколько выпуск? — Обычно до 2 минут.\n2) Где работает? — 180+ стран.\n3) Для подписок подходит? — Да.",
        Markup.inlineKeyboard([[Markup.button.url("🚀 Оформить карту", APPLY_URL)]])
    );
});

bot.catch((err) => {
    console.error("Bot error:", err);
});

// Healthcheck
app.get("/", (_, res) => res.status(200).send("AdamCardBot is alive ✅"));
app.use(express.json());

// Webhook endpoint
app.use("/telegram", bot.webhookCallback("/telegram"));

async function start() {
    // Если локально нет Render URL — просто стартуем сервер без телеграм-подключения
    if (!RENDER_EXTERNAL_URL) {
        app.listen(PORT, () => {
            console.log(`Server started locally on port ${PORT}`);
            console.log("RENDER_EXTERNAL_URL is not set. Deploy to Render to enable Telegram webhook.");
        });
        return;
    }

    app.listen(PORT, async () => {
        try {
            const webhookUrl = `${RENDER_EXTERNAL_URL}/telegram`;
            await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });
            console.log("Webhook set:", webhookUrl);
            console.log(`Server started on port ${PORT}`);
        } catch (e) {
            console.error("Startup error:", e.message);
        }
    });
}

start();

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
