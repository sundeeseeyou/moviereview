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

//Fetching data from API and store it on Array
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
    console.log(fetchResult[fetchResult.length - 1]);

    res.redirect("/new");
  } catch (error) {
    console.log(error);
  }
});

app.post("/submit", async (req, res) => {
  const lastArray = fetchResult[fetchResult.length - 1];
  const postTitle = req.body.titlepost;
  const articles = req.body.articles;
  const rating = req.body.rating;
  const client = await pool.connect();
  const response = await matchArray();

  try {
    if (response.rowCount > 0) {
      console.log(response.rows[0].id);
      res.render("test.ejs");
    } else {
      console.log(response); //this only works for existing data
      const result = await client.query(
        "INSERT INTO movie (title, year, genre, director, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [
          lastArray.title,
          lastArray.year,
          lastArray.genre,
          lastArray.director,
          lastArray.image,
        ]
      );
      const newId = result.rows[0].id;
      console.log(newId);
      res.redirect("/");
    }
  } catch (error) {
    await client.rollback();
  } finally {
    client.release();
  }
});

app.post("/test", async (req, res) => {
  try {
    if (response.rowCount > 0) {
      console.log(response.rows[0].id);
      res.render("test.ejs");
    } else {
      client
        .query(
          "INSERT INTO movie (title, year, genre, director, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [
            lastArray.title,
            lastArray.year,
            lastArray.genre,
            lastArray.director,
            lastArray.image,
          ]
        )
        .then((result) => {
          const newId = result.rows[0].id;
          console.log(newId);
          res.redirect("/");
        })
        .catch((error) => {
          console.error("Error occurred during query execution:", error);
          client.rollback();
        });
    }
  } catch (error) {
    console.error("Error occurred:", error);
    await client.rollback();
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(
    "Server is running on port " +
      PORT +
      " Click here to see " +
      `https://localhost:${PORT}`
  );
});
