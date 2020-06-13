require('dotenv').config()
const { Telegraf } = require("telegraf")
const { WELCOME_TEXT, FEED_TEXT, UPDATE_TEXT, SUBSCRIBE_TEXT, UNSUBSCRIBE_TEXT, INVALID_SET_TEXT, SET_TEXT, HELP_TEXT } = require("./config/constants")
const ReviewHandler = require("./handlers/review")
const db = require("./database")
const cron = require("node-cron")

const BOT_TOKEN = process.env.BOT_TOKEN || ""
const ADMIN_ID = parseInt(process.env.ADMIN_ID)

const Bot = new Telegraf(BOT_TOKEN)

Bot.start(ctx => {
  db.addUser({ chatId: ctx.chat.id, userId: ctx.from.id })
  ctx.replyWithMarkdown(WELCOME_TEXT)
})

Bot.command("show", async ctx => {
  ReviewHandler.sendReview(ctx.chat.id, ctx.telegram)
})

Bot.command("help", async ctx => {
  const user = (await db.getUser({ userId: ctx.from.id}))
  if (!user) await db.addUser({ chatId: ctx.chat.id, userId: ctx.from.id })
  const subscriptionStatus = user.subscriptions.pitchfork
  const minScore = user.minScore
  console.log(subscriptionStatus, minScore)
  ctx.replyWithMarkdown(HELP_TEXT(subscriptionStatus, minScore))
})

Bot.command("test", async ctx => {
  if (ctx.from.id == ADMIN_ID) {
    ctx.reply(await db.getUsers())
  }
})

Bot.command("feed", async ctx => {
  ctx.replyWithMarkdown(FEED_TEXT)
  ReviewHandler.sendAllReviews(ctx.from.id, ctx.telegram, 10)
})

Bot.command("subscribe", async ctx => {
  ctx.replyWithMarkdown(SUBSCRIBE_TEXT)
  await db.subscribeUser(ctx.from.id)
})

Bot.command("unsubscribe", async ctx => {
  ctx.replyWithMarkdown(UNSUBSCRIBE_TEXT)
  await db.unsubscribeUser(ctx.from.id)
})

Bot.command("set", async ctx => {
  const { message } = ctx
  if (!message) return 
  const { text } = message
  if (!text) return 

  if (text.split(" ").length != 2) {
    ctx.replyWithMarkdown(INVALID_SET_TEXT)
    return 
  } 

  const newScore = text.split(" ")[1]
  let newScoreNum
  try {
    newScoreNum = parseFloat(newScore)
  } catch(e) {
    ctx.replyWithMarkdown(INVALID_SET_TEXT)
  } 

  if (!newScoreNum || newScoreNum < 0) {
    ctx.replyWithMarkdown(INVALID_SET_TEXT)
    return 
  }
  
  await db.setMinScoreOfUser(newScoreNum, ctx.from.id)
  ctx.replyWithMarkdown(SET_TEXT(newScoreNum))
})

// Proxy for CRON job 
Bot.command("update", async ctx => {
  if (ctx.from.id == ADMIN_ID) {
    ctx.reply("simulate cron, updating reviews...")
    let page = 1
    if (ctx.message.text.split(" ").length == 2) page = ctx.message.text.split(" ")[1]
    await sendUpdates(page)
  }
})

const sendUpdates = async (page = 1) => {
  const newReviews = await ReviewHandler.pullReviews(page)
  if (newReviews && newReviews.length > 0) {
    const userArray = await db.getUsers()
    userArray.map(user => {
        // only send notification if user is subscribed
        if (!user.subscriptions.pitchfork) return
        const numReviewsToSend = newReviews.filter(review => review.score >= user.minScore).length
        if (numReviewsToSend != 0) {
          Bot.telegram.sendMessage(user.chatId, UPDATE_TEXT(numReviewsToSend))
          ReviewHandler.sendAllReviews(user.chatId, Bot.telegram, numReviewsToSend)
        }
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

// every day at 9am
cron.schedule("0 9 * * *", () => {
  Bot.telegram.sendMessage(ADMIN_ID, "running cron job. updating reviews...")
  sendUpdates()
}, {
  timezone: "Asia/Kuala_Lumpur"
})