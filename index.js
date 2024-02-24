import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const PORT = 3000;
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
env.config();

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
  });
});

app.post("/add", async (req, res) => {
  const title = req.body.movieTitle;
  const result = await axios.post(API_URL, {
    params: {
      apiKey: API_KEY,
      t: title,
    },
  });
  const response = JSON.stringify(result.data);
  console.log(response);
  res.render("index.ejs", { response: response });
});

app.listen(PORT, () => {
  console.log(
    "Server is running on port " +
      PORT +
      " Click here to see " +
      `https://localhost:${PORT}`
  );
});
