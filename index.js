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
  let newId;
  let movieName;
  const client = await pool.connect();
  const response = await matchArray();

  try {
    //if the movie exist, it will assign the id from database, to newId
    if (response.rowCount > 0) {
      res.send("The post exists");
    } else {
      //if the movie doesn't exist, it will put new data to the movie column
      const result = await client.query(
        "INSERT INTO movie (title, year, genre, director, image_url) VALUES (LOWER($1),$2,$3,$4,$5) RETURNING *",
        [
          lastArray.title,
          lastArray.year,
          lastArray.genre,
          lastArray.director,
          lastArray.image,
        ]
      );
      const id = result.rows[0].id;
      const movie = result.rows[0].title;
      newId = id;
      movieName = movie;
    }

    const formatName = movieName.replace(/\s+/g, "-");

    await client.query(
      "INSERT INTO blog (blog_title, movie_id, rating, blog_post) VALUES ($1,$2,$3,$4)",
      [postTitle, newId, rating, articles]
    );
    //when the post successfully uploaded to database, redirect to endpoint /movie/:name

    res.redirect(`/movie/${formatName}`);
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
});

app.get("/movie/:name", async (req, res) => {
  const name = req.params.name;
  const unformat = name
    .split("-")
    .map((word) => word.charAt(0) + word.slice(1))
    .join(" ");

  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT * FROM movie JOIN blog ON blog.movie_id = movie.id WHERE title = $1",
      [unformat]
    );
    const data = result.rows[0];
    // console.log(data.title);
    res.render("movie.ejs", {
      title: data.title,
      rating: data.rating,
      year: data.year,
      image: data.image_url,
      director: data.director,
      blog_title: data.blog_title,
      post: data.blog_post,
    });
  } catch (error) {
    console.log(error);
    res.send("Movie not exists");
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

//SELECT * FROM movie JOIN blog ON blog.movie_id = movie.id;
//option
//SELECT * FROM movie INNER JOIN blog ON blog.movie_id = movie.id WHERE title = 'La La Land';

//to format name of the movie into dashed
/*// Assuming you have the API response stored in a variable called 'apiResponse'

// Get the value from the API response
const movieName = apiResponse.name;

// Convert the string to lowercase
const lowercaseName = movieName.toLowerCase();

// Replace spaces with dashes ("-")
const formattedName = lowercaseName.replace(/\s+/g, '-');

console.log(name.toLowerCase().replace(/\s+/g, '-'))

console.log(formattedName); // Output: shawshank-redemption
*/

/*
try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    
    */
