require('dotenv').config();

const express = require("express");
const App = express();

const listener = App.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

