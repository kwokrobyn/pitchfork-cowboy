require('dotenv').config()
const { Telegraf } = require("telegraf")
const ReviewHandler = require("./handlers/review")

const BOT_TOKEN = process.env.BOT_TOKEN || ""

const Bot = new Telegraf(BOT_TOKEN)

Bot.start(ctx => ctx.replyWithMarkdown("Welcome to the Fresh Cuts Bot.\n\n\
Get the latest highly rated reviews from Pitchfork.com, straight to your phone.\n\n\
To get started, use /show to see the latest review.\n\
Use /feed to see the last 10 reviews.\n\
Let me know what you think at @kwokrobyn. \n\n\
Happy music discovering!"))

Bot.command("show", async ctx => {
  ReviewHandler.sendReview(ctx, 0)
})

Bot.command("feed", async ctx => {
  ReviewHandler.sendAllReviews(ctx)
})

// Proxy for CRON job 
Bot.hears("update", async ctx => {
  ReviewHandler.pullReviews()
  ctx.reply("updating reviews...")
})

Bot.on("callback_query", async ctx => {
  const { callbackQuery } = ctx
  if (!callbackQuery) return
  const { data } = callbackQuery
  if (!data) return
  try {
    ReviewHandler.sendReview(ctx, parseInt(data))
  } catch (err) {
      console.log("error sending previous review: ", err.message)
      await ReviewHandler.sendReview(ctx, parseInt(data + 1))
    }
})

Bot.startPolling()