const request_promise = require("request-promise")
const md5 = require("md5")
const $ = require("cheerio")

const MAIN = "/reviews/albums/?page="
const PLUS = "/best/high-scoring-albums/?page="
const PITCHFORK_URL = "https://pitchfork.com"

const pullNewestReviews = async () => {
  try {
    const res = await request_promise(PITCHFORK_URL + PLUS + "1")
    const htmlBody = $(".review__link", res)
    const hrefList = Array(htmlBody.length)
        .fill(1)
        .map((e, i) => htmlBody[i].attribs.href)
    return queryReviews(hrefList)
  } catch (err) {
    console.log("error while getting reviews", err)
  }
}

const queryReviews = async (hrefList) => {
  return Promise.all(hrefList.map(async href => {
    try {
      const res = await request_promise(PITCHFORK_URL + href)
      const htmlBody = $(".article-meta", res)
      const htmlTitle = $("title", res).text().split("Album Review | Pitchfork")[0]
      
      const artist = htmlTitle.split(": ")[0].trim()
      const album = htmlTitle.split(": ")[1].trim()
      const pub_date = formatPubDate( $(".pub-date", htmlBody)[0].attribs.datetime )

      return {
        artist: artist, 
        album: album, 
        author: $(".authors-detail__display-name", htmlBody).text(),
        pub_date: pub_date,
        genre: $(".genre-list__link", htmlBody).text(),
        score: $(".score", res).text(),
        img: $('meta[property="og:image"]', res)[0].attribs.content,
        preview: $('.review-detail__abstract', res).text(),
        link: PITCHFORK_URL + href, 
        hash: md5(artist + album + pub_date)
      }
    } catch (err) {
      console.log("error while querying reviews", err.message)
    }
  }))
}

const formatPubDate = (pub_date) => {
  return new Date(pub_date).getTime().toString()
}

module.exports = {
  pullNewestReviews
}