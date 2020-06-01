const request_promise = require("request-promise");
const $ = require("cheerio");

const PLUS = "/best/high-scoring-albums/?page=1";
const PITCHFORK_URL = "https://pitchfork.com";

exports.PullNewestReviews = async () => {
  try {
    const res = await request_promise(PITCHFORK_URL + PLUS);
    const htmlBody = $(".review__link", res);
    const hrefList = Array(htmlBody.length)
        .fill(1)
        .map((e, i) => htmlBody[i].attribs.href);
    return queryReviews(hrefList)
  } catch (err) {
    console.log("error while getting reviews", err);
  }
};

const queryReviews = async (hrefList) => {
  return hrefList.map(async href => {
    try {
      const res = await request_promise(PITCHFORK_URL + href);
      const htmlBody = $(".article-meta", res);
      const htmlTitle = $("title", res).text().split("Album Review | Pitchfork")[0];
      
      return {
        artist: htmlTitle.split(": ")[0].trim(), 
        album: htmlTitle.split(": ")[1].trim(),
        author: $(".authors-detail__display-name", htmlBody).text(),
        pub_date: $(".pub-date", htmlBody)[0].attribs.datetime,
        genre: $(".genre-list__link", htmlBody).text(),
        score: $(".score", res).text(),
        img: $('meta[property="og:image"]', res)[0].attribs.content,
        preview: $('.review-detail__abstract', res).text(),
        link: PITCHFORK_URL + href, 
      }
    } catch (err) {
      console.log("error while querying reviews", err);
    }
  })
}