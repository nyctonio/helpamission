const express = require('express');
const app = express();
require('dotenv').config();
require('./config/mongoose');
const cors = require("cors");
const PORT = process.env.PORT || 8000;
var cookieParser = require('cookie-parser');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cors());
app.use(cookieParser());
app.use('/', require('./routes/index'));




const fs = require('fs').promises;

async function readFile() {
    try {
        console.log("Reading the file...");
        const data = await fs.readFile("./books.txt");
        console.log(data.toString());
    } catch (error) {
        console.error(`Got an error trying to read the file: ${error.message}`);
    }
}

async function writeFile() {
    try {
        let data = "This is a file a of books.";
        fs.writeFile("./books.txt", data, (err) => {
            if (err)
                console.log(err);
            else {
                console.log("File written successfully\n");
                console.log("The written has the following contents:");
                console.log(fs.readFileSync("books.txt", "utf8"));
            }
        });
    } catch (error) {
        console.error(`Got an error trying to write to a file: ${error.message}`);
    }
}


app.listen(PORT, function (err) {
    if (err) {
        console.log('error in starting server', err);
        return;
    }
    writeFile();
    readFile();
    console.log('server running on port ', PORT);
});