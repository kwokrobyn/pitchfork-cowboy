const db = require("./../database")
const { pullNewestReviews } = require("./../integrations/pitchfork")
const { getAlbumLink } = require("./../integrations/spotify")

const pullReviews = async () => {
    const newReviews = await pullNewestReviews()
    return db.addReviews(newReviews)
}

const sendAllReviews = async (ctx) => {
    const reviews = await db.getReviews()
    for (let i = 0; i < Math.min(10, reviews.length); i++) {
        await sendReview(ctx, i, false);
    }
}

const sendReview = async (ctx = null, reviewId = null, chatId = null, showPrevious = true, cb = null) => {

    // if no review, send last review
    const currentReview = reviewId ? await db.getReview({_id: reviewId}) : await db.getLastReview()

    const recipientChat = chatId ? chatId : ctx.chat.id
    const albumLink = await getAlbumLink(currentReview)

    const maybeSpotifyLinkButton = albumLink
        ? {
            text: "Listen on Spotify",
            url: albumLink || "www.placeholder.com",
        }
        : null

    const maybePreviousReviewButton =
        currentReview.prev && showPrevious
            ? {
                text: "Previous",
                callback_data: `${currentReview.prev}`,
            }
            : null

    const t = cb ? cb : (ctx ? ctx.telegram : null)

    t.sendMessage(
        recipientChat, 
        formatReviewMessage(currentReview), {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        maybeSpotifyLinkButton,
                        maybePreviousReviewButton
                    ].filter(_ => _)
                ]
            }) 
        }
    )
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