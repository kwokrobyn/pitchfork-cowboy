const db = require("./../database")
const Promise = require("bluebird")
const { NO_REVIEW_FOUND_TEXT, FEED_TEXT } = require("../config/constants")
const { pullNewestReviews } = require("./../integrations/pitchfork")

const pullReviews = async (page) => {
    const newReviews = await pullNewestReviews(page)
    return db.addReviews(newReviews)
}

const sendAllReviews = async (recipient, bot, limit) => {
    const minScore = await db.getMinScoreOfUser(recipient)
    const reviews = await db.getReviewsWithMinScore(minScore, limit)
    if (reviews.length == 0) {
        bot.sendMessage(recipient, NO_REVIEW_FOUND_TEXT)
    }
    Promise.mapSeries(reviews.reverse(), (review) => {
        return sendReview(recipient, bot, review._id, false);
    })
}

const sendReview = async (recipient, bot, reviewId = null, showPrevious = true) => {
    const minScore = await db.getMinScoreOfUser(recipient)

    // if no review, send last review
    const currentReview = reviewId ?
        await db.getReview({ _id: reviewId }) :
        await db.getLastReviewWithMinScore(minScore)
    if (!currentReview) bot.sendMessage(recipient, NO_REVIEW_FOUND_TEXT) // TODO: polish
    else await bot.sendMessage(recipient, ...await formatReview(currentReview, showPrevious, showSpotify = true, minScore))
}

const formatReview = async (currentReview, showPrevious, showSpotify, minScore) => {
    const maybeSpotifyLinkButton = currentReview.spotifyUrl && showSpotify
        ? {
            text: "Listen on Spotify",
            url: currentReview.spotifyUrl || "www.placeholder.com",
        }
        : null
    
    let maybePreviousReviewButtonData = null
    if (showPrevious) {
        const lastReview = await db.getLastReviewWithMinScore(
            minScore, 
            currentReview.pub_date, 
            currentReview.pub_date_order
        )
        maybePreviousReviewButtonData = lastReview ? lastReview._id : null
    }
    
    const maybePreviousReviewButton =
        maybePreviousReviewButtonData ? 
            {
                text: "Previous",
                callback_data: `${maybePreviousReviewButtonData}`,
            }
            : null

    return [formatReviewMessage(currentReview), {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    maybeSpotifyLinkButton,
                    maybePreviousReviewButton
                ].filter(_ => _)
            ]
        })
    }]
}

const formatReviewMessage = review => {
    return `*Published on:* ${formatReleaseTime(review.pub_date)}\n*Genre:* ${
        review.genre
        }\n[Read on Pitchfork.com](${review.link})`
}

const formatReleaseTime = dateTime => {
    const d = new Date(Number(dateTime))
    const options = { month: "long" }
    return `${new Intl.DateTimeFormat("en-US", options).format(
        d
    )} ${d.getDate()}, ${d.getFullYear()}`
}


module.exports = {
    pullReviews,
    sendReview,
    sendAllReviews
}