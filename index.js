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

let movieList = [];
let fetchResult = [
  {
    title: "No Data",
    image_url: "/images/nodata.png",
  },
];

app.get("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM movie ORDER BY id DESC LIMIT 4"
    );
    movieList = result.rows;
    // console.log(movieList);
    res.render("index.ejs", {
      listMovie: movieList,
    });
  } catch (error) {}
});

//open text editor
app.get("/new", (req, res) => {
  res.render("post.ejs", {
    heading: "New Post",
    submit: "Create",
    fetchResult: fetchResult,
  });
});

app.post("/new", async (req, res) => {
  //this variable is taken from post.ejs form under name "movietitle"
  const title = req.body.movietitle;
  //initiate the connect to the pool database
  const client = await pool.connect();
  //Axios to do GET from API omdb.com
  try {
    const result = await axios.get(API_URL, {
      params: {
        apiKey: API_KEY,
        t: title,
      },
    });
    const api_result = result.data;

    /*This will check the availability of the movie from database, if it exists, just push to array fetchResult
    Otherwise, it will INSERT INTO the database, then later on, will also push to the array fetchResult*/
    try {
      const response = await client.query(
        "Select * FROM movie WHERE title = $1",
        [api_result.Title]
      );
      // console.log(response.rows[0].title);
      if (response.rows.length > 0) {
        fetchResult.push({
          title: response.rows[0].title,
          year: response.rows[0].year,
          director: response.rows[0].director,
          genre: response.rows[0].genre,
          image_url: response.rows[0].image_url,
        });
      } else {
        try {
          if (api_result.Response === "True") {
            // await client.query(
            //   "INSERT INTO movie(title, year, director, genre, image_url) VALUES ($1, $2, $3, $4, $5)",
            //   [
            //     api_result.Title,
            //     api_result.Year,
            //     api_result.Director,
            //     api_result.Genre,
            //     api_result.Poster,
            //   ]
            // );
            fetchResult.push({
              title: api_result.Title,
              year: api_result.Year,
              director: api_result.Director,
              genre: api_result.Genre,
              image_url: api_result.Poster,
              status: api_result.Response,
            });
          } else {
            fetchResult.push({
              title: "The movie is not found",
              image_url: "/images/nodata.png",
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.log(error);
    }

    console.log(fetchResult[fetchResult.length - 1]);
    // console.log(api_result.Response);

    res.redirect("/new");
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
});

app.post("/submit", async (req, res) => {
  const postTitle = req.body.titlepost;
  const articles = req.body.articles;
  const rating = req.body.rating;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO movie(title,year,rating,director,genre,image_url) VALUES ($1,$2,$3,$4,$5,$6)",
      [postTitle]
    );
  } catch (error) {}
});

app.listen(PORT, () => {
  console.log(
    "Server is running on port " +
      PORT +
      " Click here to see " +
      `https://localhost:${PORT}`
  );
});
