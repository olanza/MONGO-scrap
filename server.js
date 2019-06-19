const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./models");
const PORT = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/HomeworkDB"
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true
});

app.get("/scrape", function(req, res) {
  axios
    .get("https://www.thrillist.com/drink/nation/best-rooftop-bars/food-and-drink")
    .then(function(response) {
      var $ = cheerio.load(response.data);

      $("section.save-venue").each(function(i, element) {

        var result = {};

        result.title = $(this)
          .find("a")
          .text();
        result.link = $(this)
          .find("a")
          .attr("href");
        result.body = $(this)
          .children("p")
          .text();
        console.log("result - title/link/body", result.title);
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err.message);
          });
      });

      res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {

  db.Article.findOne({
    _id: req.params.id
  })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });

});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        {
          _id: req.params.id
        },
        { $set: { note: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});