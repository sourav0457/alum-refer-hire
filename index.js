const express = require('express')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
// const twilio = require('./send_sms')
const port = '3000';

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'sourav1995',
    database:'ubhacking'
})

connection.connect(function(err){
  if (err) throw err;
  console.log("DB connection is working");
})

app.get('/', (request, response) => {
    response.json({
        info: "It's working!"
    })
})

// Get all jobs - for job listing
// Get all jobs applied for a particular student
// Get all jobs applied for a particular alumni
// Get all jobs posted - for an alumni

// Create a user
app.post('/user/add', function(request, response){
    var name = request.body.name
    var major = request.body.major
    var degree = request.body.degree
    var graduationDate = request.body.graduationDate
    var role = request.body.role
    var bio = request.body.bio

    connection.query(
        "INSERT INTO ubhacking.Users (name, major, degree, graduationDate, role, bio) VALUES ( '"+ name +"' ,'" + major + "','" + degree +"' ,'" + graduationDate +"' ,'" + role +"' ,'" + bio + "');", 
        (error, results) => {
            if(error) throw error;
            response.status(200).send('Successfully Added User to database');
    })
})



// Apply for a job - Alumni and Student
// Post a new job - Alumni

app.listen(port, () => {
    console.log(`App is running on port ${port}.`)
})