require('dotenv').config();

const express = require("express");

const App = express();

App.get("/getreviews", async (req, res) => {
  const today = Date.now().getDate();
  const reply = await PullNewestReviews();
  reply
    .filter(review => {
      Date.parse(review.pub_date).getDate() == Date.parse(review.pub_date).getDate();
    })
    .map(review => Bot.replyWithMarkdown(formatReviewMessage(review)));
});

const listener = App.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

