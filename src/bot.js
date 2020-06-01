require('dotenv').config();

const express = require("express");
const request_promise = require("request-promise");
const $ = require("cheerio");
const { Telegraf } = require("telegraf");

const { PullNewestReviews } = require("./integrations/pitchfork");
const { getAlbumLink } = require("./integrations/spotify");

const BOT_TOKEN = process.env.BOT_TOKEN || "";

const Bot = new Telegraf(BOT_TOKEN);

let reviews = [];

Bot.start(ctx => ctx.replyWithMarkdown("Welcome to the Fresh Cuts Bot. "));

Bot.hears("test", async ctx => {
  await getAlbumLink("sheeran");
});

Bot.hears("hi", async ctx => {
  sendReview(ctx, 0);
});

Bot.on("callback_query", async ctx => {
  const { callbackQuery } = ctx;
  if (!callbackQuery) return;
  const { data } = callbackQuery;
  if (!data) return;
  try {
    sendReview(ctx, parseInt(data));
  } catch (err) {
    sendReview(ctx, parseInt(data + 1));
  }
});

const sendReview = async (ctx, index) => {
  if (reviews.length == 0) {
    console.log("pulling reviews...")
    const newReviews = await PullNewestReviews();
    reviews = reviews.concat(newReviews);
  }

  const resolvedReviews = Promise.all(reviews);
  const currentReview = (await resolvedReviews)[index];

  const albumLink = await getAlbumLink(currentReview);

  const maybeSpotifyLinkButton = albumLink
    ? {
        text: "Listen on Spotify",
        url: albumLink || "www.placeholder.com",
      }
    : null;

  const maybePreviousReviewButton =
    index < reviews.length
      ? {
          text: "Previous",
          callback_data: `${index + 1}`,
        }
      : null;

  ctx.replyWithMarkdown(formatReviewMessage(currentReview), {
    reply_markup: {
      inline_keyboard: [
        [
          maybeSpotifyLinkButton,
          maybePreviousReviewButton
        ].filter(_ => _)
      ]
    }
  });
};

const formatReviewMessage = review => {
    return `*Published on:* ${formatReleaseTime(review.pub_date)}\n*Genre:* ${
      review.genre
    }\n[Read on Pitchfork.com](${review.link})`;
  };
  
  const formatReleaseTime = dateTime => {
    const d = new Date(dateTime);
    const options = { month: "long" };
    return `${new Intl.DateTimeFormat("en-US", options).format(
      d
    )} ${d.getDate()}, ${d.getFullYear()}`;
  };

Bot.startPolling();