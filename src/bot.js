require('dotenv').config()
const { Telegraf } = require("telegraf")
const { WELCOME_TEXT, FEED_TEXT, SUBSCRIBE_TEXT, UNSUBSCRIBE_TEXT } = require("./config/constants")
const ReviewHandler = require("./handlers/review")
const db = require("./database")
const cron = require("node-cron")

const BOT_TOKEN = process.env.BOT_TOKEN || ""
const ADMIN_ID = process.env.ADMIN_ID

const Bot = new Telegraf(BOT_TOKEN)

Bot.start(ctx => {
  db.addUser({ chatId: ctx.chat.id, userId: ctx.from.id })
  ctx.replyWithMarkdown(WELCOME_TEXT)
})

Bot.command("show", async ctx => {
  ReviewHandler.sendReview(ctx.chat.id, ctx.telegram)
})

Bot.command("test", async ctx => {
  console.log(await db.getUsers())
})

Bot.command("feed", async ctx => {
  ctx.replyWithMarkdown(FEED_TEXT)
  ReviewHandler.sendAllReviews(ctx)
})

Bot.command("subscribe", async ctx => {
  ctx.replyWithMarkdown(SUBSCRIBE_TEXT)
  await db.subscribeUser(ctx.from.id)
})

Bot.command("unsubscribe", async ctx => {
  ctx.replyWithMarkdown(UNSUBSCRIBE_TEXT)
  await db.unsubscribeUser(ctx.from.id)
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
        // only send notification if user is subscribed
        if (!user.subscriptions.pitchfork) return
        ReviewHandler.sendReview(user.chatId, Bot.telegram, undefined, true)
    })
  }
}

Bot.on("callback_query", async ctx => {
  const { callbackQuery } = ctx
  if (!callbackQuery) return
  const { data } = callbackQuery
  if (!data) return
  try {
    ReviewHandler.sendReview(ctx.chat.id, ctx.telegram, data)
  } catch (err) {
      console.log("error sending previous review: ", err.message)
      await ReviewHandler.sendReview(ctx.chat.id, ctx.telegram)
    }
})

Bot.startPolling()

// every day at 9am and 6pm 
cron.schedule("0 9 * * *", () => {
  Bot.telegram.sendMessage(ADMIN_ID, "running cron job...")
  sendUpdates()
}, {
  timezone: "Asia/Kuala_Lumpur"
})