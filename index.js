const express = require('express');
const app = express();
require('dotenv').config();
require('./config/mongoose');
const cors = require("cors");
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cors());
app.use('/', require('./routes/index'));


app.listen(PORT, function (err) {
    if (err) {
        console.log('error in starting server', err);
        return;
    }
    console.log('server running on port ', PORT);
});