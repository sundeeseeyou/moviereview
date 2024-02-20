import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const PORT = 3000;
const API_URL = "http://www.omdbapi.com/";
const API_KEY = "6ae9c7e1";

const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "moviereview",
    password: "123", //adjust based on your local password
    port: 5432
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let movieList = [];

app.get("/", async (req,res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM movie ORDER BY id DESC LIMIT 5');
        movieList = result.rows;
        console.log(movieList);
        res.render("index.ejs",{
            listMovie: movieList
        })
    } catch (error) {
    }
});

//open text editor
app.get("/new", (req,res) => {
    res.render("post.ejs",{
        heading: "New Post",
        submit: "Create"
    })
})

app.post("/add", async (req,res) => {
    const title = req.body.movieTitle;
    const result = await axios.post(API_URL,{
        params: {
            apiKey : API_KEY,
            t: title,
        }
    });
    const response = JSON.stringify(result.data);
    console.log(response);
    res.render("index.ejs", {response:response})
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT + " Click here to see " + `https://localhost:${PORT}`);
})