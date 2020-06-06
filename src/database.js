const Datastore = require("nedb-promises")
const { MAX_FEED_SIZE } = require("./config/constants")

const db = {
    users: new Datastore({ filename: "./config/users.db", autoload: true }),
    reviews: new Datastore({ filename: "./config/reviews.db", autoload: true }),
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
        return (await countReviews({hash : review.hash}) == 0)
    })

    // sort reviews by pub_date 
    newReviews.sort((a, b) => (a.pub_date > b.pub_date) ? 1 : -1)
    console.log("new reviews: " + newReviews.map(review => review.pub_date + " "))
    
    newReviews
        .reduce( async (prevId, review, i, _) => {
            console.log("last prevId: ", prevId)
            const newReview = await db.reviews.insert({...review, prev: await prevId})
            .catch(e => console.log("error adding reviews", e.message))
            console.log("review just added", newReview)
            return newReview._id
        }, null)

    garbageCollection()
    return newReviews
}

const getLastReview = async () => {
    const last = await db.reviews.findOne({}).sort({ pub_date: -1 }).limit(1)
    return last
}

//db.reviews.remove({})

const getReviews = async (query = {}) => {
    const results = await db.reviews.find(query).sort({ pub_date: -1 })
        .catch(e => console.log("error getting reviews", e.message))

    return results
}

const getReview = async (query = {}) => {
    const review = await db.reviews.findOne(query)
        .catch(e => console.log("error getting reviews", e.message))

    return review
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
}

/*
*  USERS 
*/
const addUser = async (user) => {
    await db.users.remove({ userId : user.userId })
    await db.users.insert(user)
    return user
}

const getUsers = async () => {
    const result = await db.users.find()
        .catch(e => console.log("error getting users", e.message))
    return result
}


async function filter(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
  }

module.exports = {
    addReviews, 
    getReviews,
    countReviews,
    addUser,
    getUsers,
    getReview,
    getLastReview
}

