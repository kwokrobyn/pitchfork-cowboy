const Datastore = require("nedb-promises")
const { MAX_FEED_SIZE } = require("./config/constants")

const db = {
    users: new Datastore({ filename: "./config/users.db", autoload: true }),
    reviews: new Datastore({ filename: "./config/reviews.db", autoload: true }),
}

const addReviews = async (reviews) => {
    const newReviews = await filter(reviews, async review => {
        return (await countReviews({hash : review.hash}) == 0)
    })
    
    newReviews
        .map(async review => {
            await db.reviews.insert(review)
            .catch(e => console.log("error adding reviews", e.message))
        })

    garbageCollection()
}

//db.reviews.remove({})

const getReviews = async (query = {}) => {
    const results = await db.reviews.find(query).sort({ pub_date: -1 })
        .catch(e => console.log("error getting reviews", e.message))

    return results
}

const countReviews = async (query = {}) => {
    const count = await db.reviews.count(query)
    console.log("match query: ", count)
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

async function filter(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
  }

module.exports = {
    addReviews, 
    getReviews,
    countReviews
}

