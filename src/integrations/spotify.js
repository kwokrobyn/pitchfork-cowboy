const axios = require("axios");
const querystring = require("querystring");

exports.getAlbumLink = async query => {
  await refreshAccessTokenIfNeeded();
  let returnLink;
  returnLink = await querySearch(`${query.artist}%20${query.album}`, "album");
  // if album doesn't exist, try artist page
  if (!returnLink) {
    returnLink = await querySearch(`${query.artist}`, "artist");
  }

  return returnLink;
};

const querySearch = async (query, type) => {
  const res = await axios.get(
    `https://api.spotify.com/v1/search?q=${query}&type=${type}`,
    {
      headers: { Authorization: "Bearer " + process.env.SPOTIFY_TOKEN }
    })
    .catch(err => {
      console.log("encountered unexpected error while querying: ", err.message);
      return null
    })

  if (res) return formatResult(type, res)
  return null
};



const formatResult = (type, res) => {
  let ret;
  try {
    switch (type) {
      case "album":
        ret = res.data.albums.items[0].external_urls.spotify;
        break;
      case "artist":
        ret = res.data.artists.items[0].external_urls.spotify;
    }
  } catch (err) {
    console.log(`no spotify ${type} found: `, err.message);
  }
  return ret;
};

const refreshAccessTokenIfNeeded = async () => {
  if (!(await querySearch("sinatra", "album"))) {
    console.log("refreshing")
    try {
      const res = await axios.post(
        `https://accounts.spotify.com/api/token`,
        querystring.stringify({ grant_type: "client_credentials" }),
        {
          headers: { Authorization: "Basic " + process.env.SPOTIFY_CLIENT }
        }
      );
      process.env.SPOTIFY_TOKEN = res.data.access_token;
      return;
    } catch (err) {
      console.log("failed to get access token: ", err.message);
    }
  }
};
