const db = require("./../database")
const Promise = require("bluebird")
const { pullNewestReviews } = require("./../integrations/pitchfork")

const pullReviews = async () => {
    const newReviews = await pullNewestReviews()
    return db.addReviews(newReviews)
}

const sendAllReviews = async (ctx) => {
    const reviews = await db.getReviews()
    Promise.mapSeries(reviews, (review) => {
        return sendReview(ctx.chat.id, ctx.telegram, review._id, false);
    })
}

const sendReview = async (recipient, bot, reviewId = null, showPrevious = true) => {
    // if no review, send last review
    const currentReview = reviewId ? await db.getReview({_id: reviewId}) : await db.getLastReview()
    await bot.sendMessage(recipient, ...formatReview(currentReview, showPrevious, true))
}

const formatReview = (currentReview, showPrevious, showSpotify) => {
    const maybeSpotifyLinkButton = currentReview.spotifyUrl && showSpotify
        ? {
            text: "Listen on Spotify",
            url: currentReview.spotifyUrl || "www.placeholder.com",
        }
        : null

    const maybePreviousReviewButton =
        currentReview.prev && showPrevious
            ? {
                text: "Previous",
                callback_data: `${currentReview.prev}`,
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