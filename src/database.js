const Datastore = require("nedb-promises")
const { MAX_FEED_SIZE } = require("./config/constants")
const Spotify = require("./integrations/spotify")

const db = {
    users: Datastore.create({ filename: "./config/users.db", autoload: true }),
    reviews: Datastore.create({ filename: "./config/reviews.db", autoload: true }),
}

db.reviews.ensureIndex({
    fieldName: "pub_date"
})

/*
*  REVIEWS 
*/
const addReviews = async (reviews) => {
    // filter out reviews if they already exist 
    const newReviews = await filter(reviews, async review => {
        return (await countReviews({ hash: review.hash }) == 0)
    })

    console.log("new reviews count: " + newReviews.length)
    // sort reviews by pub_date 
    newReviews.sort((a, b) => (a.pub_date > b.pub_date) ? 1 : -1)

    const lastExistingReview = await getLastReview()
    const lastExistingReviewId = lastExistingReview ? lastExistingReview._id : null

    await newReviews
        .reduce(async (prevId, review, i, _) => {
            const newReview = await db.reviews.insert({
                 ...review, 
                 prev: await prevId, 
                 pub_date_order: await numSameDay(review.pub_date),
                 spotifyUrl: await Spotify.getAlbumLink(review)
                })
                .catch(e => console.log("error adding reviews", e.message))
            return newReview._id
        }, lastExistingReviewId)

    garbageCollection()
    return newReviews
}

const getReviewsWithMinScore = async (minScore, limit) => {
    const results = await getReviews({score: { $gte: minScore }})
    return results
}

const numSameDay = async (date) => {
    const count = await db.reviews.count({pub_date: date})
    return count
}

const getLastReview = async () => {
    const last = await db.reviews.findOne({}).sort({ pub_date: -1 }).limit(1)
    return last
}

const getReview = async (query = {}) => {
    const review = await db.reviews.findOne(query)
        .catch(e => console.log("error getting review", e.message))
    return review
}

const getReviews = async (query = {}, limit = 10) => {
    const results = await db.reviews.find(query).sort({ pub_date: -1 }).limit(limit)
        .catch(e => console.log("error getting reviews", e.message))
    return results
}

const countReviews = async (query = {}) => {
    const count = await db.reviews.count(query)
    return count
}

const garbageCollection = () => {
    db.reviews.count({}, (err, count) => {
        if (err) console.log("db: failed to count")
        if (count > MAX_FEED_SIZE) {
            // TODO: Implement this lmao 
        }
    })
    .then(()=> db.reviews.persistence.compactDatafile)
}

/*
*  USERS 
*/
const addUser = async (user) => {
    await db.users.remove({ userId: user.userId })
    await db.users.insert({...user, "subscriptions": {"pitchfork": true}})
    .then(()=> db.users.persistence.compactDatafile)
    return user
}

const getUsers = async (query = {}) => {
    const result = await db.users.find(query)
        .catch(e => console.log("error getting users", e.message))
    return result
}

const getUser = async (query = {}) => {
    const result = await db.users.findOne(query)
        .catch(e => console.log("error getting users", e.message))
    return result
}

const subscribeUser = async (userId) => {
    db.users.update({ userId: userId }, { $set: { "subscriptions.pitchfork": true } })
    .catch(e => console.log("error subscribing user", e.message))
    .then(()=> db.users.persistence.compactDatafile)
    
}

const unsubscribeUser = async (userId) => {
    db.users.update({ userId: userId }, { $set: { "subscriptions.pitchfork": false } })
        .catch(e => console.log("error unsubscribing user", e.message))
        .then(()=> db.users.persistence.compactDatafile)
}

/*
* HELPERS
*/
async function filter(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i => i !== fail)
}

module.exports = {
    addReviews,
    getReviews,
    countReviews,
    addUser,
    getUser,
    getUsers,
    getReview,
    getLastReview,
    subscribeUser,
    unsubscribeUser
}

