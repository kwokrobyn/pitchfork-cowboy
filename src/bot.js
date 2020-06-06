require('dotenv').config()
const { Telegraf } = require("telegraf")
const ReviewHandler = require("./handlers/review")
const db = require("./database")
const cron = require("node-cron")

const BOT_TOKEN = process.env.BOT_TOKEN || ""

const Bot = new Telegraf(BOT_TOKEN)

Bot.start(ctx => {

  db.addUser({ chatId: ctx.chat.id, userId: ctx.from.id })

  ctx.replyWithMarkdown("Welcome to the Fresh Cuts Bot.\n\n\
Get the latest highly rated reviews from Pitchfork.com, straight to your phone.\n\n\
To get started, use /show to see the latest review.\n\
Use /feed to see the last 10 reviews.\n\
Let me know what you think at @kwokrobyn. \n\n\
Happy music discovering!")
})

Bot.command("show", async ctx => {
  ReviewHandler.sendReview(ctx)
})

Bot.command("feed", async ctx => {
  ReviewHandler.sendAllReviews(ctx)
})

// Proxy for CRON job 
Bot.hears("update", async ctx => {
  ctx.reply("simulate cron, updating reviews...")
  await sendUpdates()
})

const sendUpdates = async () => {
  const newReviews = await ReviewHandler.pullReviews()
  if (newReviews && newReviews.length > 0) {
    const userArray = await db.getUsers()
    userArray.map(user => {
        ReviewHandler.sendReview(ctx = null, reviewId = null, userId = user.chatId, showPrevious = true, cb = Bot.telegram)
    })
  }
}

Bot.on("callback_query", async ctx => {
  const { callbackQuery } = ctx
  if (!callbackQuery) return
  const { data } = callbackQuery
  if (!data) return
  try {
    ReviewHandler.sendReview(ctx, data)
  } catch (err) {
      console.log("error sending previous review: ", err.message)
      await ReviewHandler.sendReview(ctx)
    }
})

Bot.startPolling()

// every day at 9am
cron.schedule("22 13 * * *", () => {
  Bot.telegram.sendMessage(758907078, "running cron job...")
  sendUpdates()
}, {
  timezone: "Asia/Kuala_Lumpur"
})