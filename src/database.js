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
    const results = await getReviews({score: { $gte: minScore }}, limit)
    return results
}

const getLastReviewWithMinScore = async (minScore, date, dateOrder) => {
// Find the most recent review with the qualifying min score

    if (!date && !dateOrder) {
        return getLastReview({score: {$gte: minScore}})
    }

    let maybeSameDayResult
    if (dateOrder > 0) {
        maybeSameDayResult = await db.reviews.findOne({ score: {  $gte: minScore }, pub_date: date, pub_date_order: { $lt: dateOrder } }).sort({ pub_date_order: -1 }).limit(1)
    }
    if (maybeSameDayResult) return maybeSameDayResult
    const res = await db.reviews.findOne({ score: { $gte: minScore }, pub_date: {  $lt: date } }).sort({ pub_date: -1, pub_date_order: -1 }).limit(1)
    return res
} 

const numSameDay = async (date) => {
    const count = await db.reviews.count({pub_date: date})
    console.log(count)
    return count
}

const getLastReview = async (query = {}) => {
    const last = await db.reviews.findOne(query).sort({ pub_date: -1 , pub_date_order: -1})
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
    await db.users.insert({...user, "subscriptions": {"pitchfork": true}, "minScore": 5.0})
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

const getMinScoreOfUser = async (userId) => {
    return (await getUser({userId : userId})).minScore
}

const setMinScoreOfUser = async (minScore, userId) => {
    await db.users.update({ userId: userId }, { $set: { minScore: parseFloat(minScore) } })
        .catch(e => console.log("error setting minScore of user", e.message))
        .then(()=> db.users.persistence.compactDatafile)
    return minScore
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
    getReviewsWithMinScore,
    getLastReviewWithMinScore,
    countReviews,
    addUser,
    getUser,
    getUsers,
    getReview,
    getLastReview,
    subscribeUser,
    unsubscribeUser,
    getMinScoreOfUser,
    setMinScoreOfUser
}

