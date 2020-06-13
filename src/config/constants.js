
const UPDATE_TEXT = (num) => {
    dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const day = dayMap[(new Date()).getDay()]
    return `🐴 🐴 🐴 Happy ${day} partner. I wrangled you ${num} fresh review(s). Time to get caught up! 🐴 🐴 🐴`
}

const SET_TEXT = (num) => {
    return `Alright, you\'ve set your minimum score as ${num}. To set it again, type \"/set _(decimal number between 0-10)_\"`
}

const HELP_TEXT = (subscriptionStatus, minScore) => {
    const subscriptionText = subscriptionStatus ? 
`You're set to receive updates of albums rated ${minScore} or better. To set a new minimum score, type \"/set _(decimal number between 0-10)_\"`:
`You're currently not subscribed to receive daily updates.`

    return `Need a refresher? 🤔 Alright, lemme show you the ropes. \n\
Since you've taken up shop here, you'll get new Pitchfork.com album reviews sent to your phone.\n\n\
${subscriptionText}\n\
You can also use /show to see the latest album, or /feed to see the last few albums (up to 10).\n\
Use /unsubscribe and /subscribe to toggle scheduled updates.\n\n\
Send your thoughts to the sheriff - @kwokrobyn. \n\n\
Happy music discovering, partner!`
}

module.exports = {
    MAX_FEED_SIZE: 100,
    WELCOME_TEXT: "*Yeehaw, I'm the Pitchfork Cowboy!* 🤠 \n\
(scheduled push notifications of Pitchfork.com reviews)\n\n\
I haven't seen you 'round these parts... 🤔 Anyhow, lemme show you the ropes. \n\n\
Since you've taken up shop here, you'll get new Pitchfork.com reviews sent to your phone.\n\
You're set to receive updates of albums rated 5.0 or better. To set your minimum score, type \"/set _(decimal number between 0-10)_\"\n\
You can also use /show to see the latest review, or /feed to see the last 10 reviews.\n\
Use /unsubscribe and /subscribe to toggle scheduled updates.\n\n\
Send your thoughts to the sheriff - @kwokrobyn. \n\n\
Happy music discovering, partner!",
    FEED_TEXT: "Here are the latest reviews.",
    SUBSCRIBE_TEXT: "Yeehaw, you're subscribed! You'll be notified whenever a new review is posted.",
    UNSUBSCRIBE_TEXT: "Alright alright alright, you're unsubscribed. Use /subscribe anytime to get regular updates again.",
    NO_REVIEW_FOUND_TEXT: "Aw shucks, the well is dry boy, there ain't no reviews left. Set a lower minimum score and try again.",
    UPDATE_TEXT,
    INVALID_SET_TEXT: "I can't understand that. To set new score, type \"/set _(decimal number between 0-10)_\"",
    SET_TEXT,
    HELP_TEXT,
}