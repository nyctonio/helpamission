const express = require('express');
const app = express();
require('dotenv').config();
require('./config/mongoose');
const cors = require("cors");
const PORT = process.env.PORT || 8000;
var cookieParser = require('cookie-parser');
const { getAllSchedulingData } = require('./utils/sheduler');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cors());
app.use(cookieParser());
app.use('/', require('./routes/index'));







app.listen(PORT, function (err) {
    if (err) {
        console.log('error in starting server', err);
        return;
    }
    getAllSchedulingData();
    console.log('server running on port ', PORT);
});