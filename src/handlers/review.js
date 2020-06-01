const { addReviews, countReviews, getReviews } = require("./../database")
const { pullNewestReviews } = require("./../integrations/pitchfork")
const { getAlbumLink } = require("./../integrations/spotify")

const pullReviews = async () => {
    const newReviews = await pullNewestReviews()
    addReviews(newReviews)
}

const sendAllReviews = async (ctx) => {
    const reviews = await getReviews()
    for (let i = 0; i < Math.min(10, reviews.length); i++) {
        await sendReview(ctx, i, false);
    }
}

const sendReview = async (ctx, index, showPrevious = true) => {
    const reviews = await getReviews()
    if (reviews.length == 0) return

    const currentReview = reviews[index]

    ctx.replyWithMarkdown(formatReviewMessage(currentReview), {
        reply_markup: await generateReplyMarkup(currentReview, index, showPrevious)
    })
}

const generateReplyMarkup = async (currentReview, index, showPrevious) => {
    const albumLink = await getAlbumLink(currentReview)

    const maybeSpotifyLinkButton = albumLink
        ? {
            text: "Listen on Spotify",
            url: albumLink || "www.placeholder.com",
        }
        : null

    const maybePreviousReviewButton =
        index < await countReviews() && showPrevious
            ? {
                text: "Previous",
                callback_data: `${index + 1}`,
            }
            : null

    return {
        inline_keyboard: [
            [
                maybeSpotifyLinkButton,
                maybePreviousReviewButton
            ].filter(_ => _)
        ]
    }
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
    sendAllReviews,
    generateReplyMarkup
}