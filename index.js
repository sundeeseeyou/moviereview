import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const PORT = 3000;
env.config();

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// let movieList = [];
let fetchResult = [
  {
    title: "Please fetch some data",
    year: "Please fetch some data",
    genre: "Please fetch some data",
    director: "Please fetch some data",
    image: "/images/nodata.png",
  },
];

async function checkMovie() {
  const client = await pool.connect();
  const result = await client.query(
    "SELECT * FROM movie ORDER BY id DESC LIMIT 4"
  );
  let movieList = [];
  movieList = result.rows;
  return movieList;
}

async function matchArray() {
  const client = await pool.connect();
  const result = await client.query("SELECT * FROM movie WHERE title = $1", [
    fetchResult[fetchResult.length - 1].title,
  ]);
  return result;
}

app.get("/", async (req, res) => {
  const listMovie = await checkMovie();
  res.render("index.ejs", {
    listMovie: listMovie,
  });
});

//open text editor
app.get("/new", (req, res) => {
  res.render("post.ejs", {
    heading: "New Post",
    submit: "Create",
    fetchResult: fetchResult,
  });
});

//open add new post
app.post("/new", async (req, res) => {
  const title = req.body.movietitle;
  try {
    const result = await axios.get(API_URL, {
      params: {
        apiKey: API_KEY,
        t: title,
      },
    });

    fetchResult.push({
      title: result.data.Title,
      year: result.data.Year,
      genre: result.data.Genre,
      director: result.data.Director,
      image: result.data.Poster,
      status: result.data.Response,
    });
    // console.log(fetchResult[0]);

    res.redirect("/new");
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit", async (req, res) => {
  // const postTitle = req.body.titlepost;
  // const articles = req.body.articles;
  // const rating = req.body.rating;
  // const client = await pool.connect();
  const response = await matchArray();

  try {
    if (response.rowCount > 0) {
      res.redirect("/new");
    } else {
      console.log(response.rows[0].id);
      console.log(response.rows[0].title);
    }
  } catch (error) {
    console.log(error);
  }

  res.render("test.ejs");
});

app.get("/test", async (req, res) => {
  fetchResult.forEach((item) => {
    const title = item.title;
    const year = item.year;
    const genre = item.genre;
    const director = item.director;
    const image = item.image;
  });

  res.render("test.ejs", {
    testing: "Hello",
  });
});

app.listen(PORT, () => {
  console.log(
    "Server is running on port " +
      PORT +
      " Click here to see " +
      `https://localhost:${PORT}`
  );
});
