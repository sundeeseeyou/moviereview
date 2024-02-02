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

app.get("/", (req,res) => {
    res.render("index.ejs",{greeting: "Hello"});

    // try {
    //     const client = await pool.connect();
    //     const result = await client.query("SELECT * FROM post");
    //     movieList = result.rows;
    //     res.render("index.ejs",{
    //         recentpost: movieList,

    //     })
    // } catch (error) {
        
    // } finally {
    //     if (client) client.release();
    //   }
});


app.listen(PORT, () => {
    console.log("Server is running on port " + PORT + " Click here to see " + `https://localhost:${PORT}`);
})