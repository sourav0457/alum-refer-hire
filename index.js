const http = require('http');
const express = require('express')
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const app = express();
const cors = require('cors');
// const twilio = require('./send_sms')
const port = '3000';
const dateTime = require('node-datetime');

app.use(fileUpload({createParentPath: true}));
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));

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

// Get user details
// Role 0: Student, Role 1: Alumni
app.get('/user/:id/details', function(request, response){
    var id = request.params.id
    var sql = "SELECT u.id, name, major, degree, graduationDate, role, bio, mobNumber, resume FROM USERS u LEFT OUTER JOIN ubhacking.resumes r ON u.id = r.uid WHERE u.id = " + id + " ORDER BY r.id DESC LIMIT 1;"
    connection.query(sql, function (error, result) {
        response.json(result);
    })
})

// Get job for a particular Candidate
app.get('/user/:jobId/getCandidates', function(request, response){
    var jobId = request.params.jobId
    var sql = "SELECT name, major, degree, graduationDate, resume FROM ubhacking.jobsApplied ja INNER JOIN ubhacking.users u ON ja.uid = u.id LEFT OUTER JOIN ubhacking.resumes r ON ja.uid = r.uid WHERE ja.jlid = " + jobId + ";"
    connection.query(sql, function (error, result) {
        response.json(result);
    })
})

// Get all jobs - for job listing
app.get('/jobs/fetchAll', function(request, response){
    var sql = "SELECT postedBy, nameOfCompany, logo, position, datePosted, name FROM ubhacking.JobListings jl INNER JOIN ubhacking.users u ON jl.postedBy = u.id WHERE jl.status <> 1;"
    connection.query(sql, function (error, result) {
        response.send({
            data: result
        });
    })
})

// Get all jobs applied for a particular student
app.get('/jobs/:studentId/fetchAppliedJobs', function(request, response){
    var studentId = request.params.studentId
    var sql = "SELECT nameOfCompany, logo, position, datePosted, ja.status, ja.dateOfApplication FROM ubhacking.JobListings jl INNER JOIN ubhacking.jobsApplied ja ON jl.id = jlid WHERE ja.uid = " + studentId + ";"
    connection.query(sql, function (error, result) {
        // response.json(result);
        response.send({
            data: result
        })
    })
})

// Get all jobs posted - for an alumni
app.get('/jobs/:studentId/fetchPostedJobs', function(request, response){
    var studentId = request.params.studentId
    var sql = "SELECT nameOfCompany, logo, position, datePosted, status FROM ubhacking.JobListings INNER JOIN ubhacking.users u ON postedBy = u.id WHERE u.id = " + studentId + ";"
    connection.query(sql, function (error, result) {
        response.send({
            data: result
        });
    })
})

// Handle an incoming Twilio message
app.post('/sms', function(request, response){
    const twiml = new MessagingResponse();

    var pattern = /Push/;
    var pattern2 = /List/;
    var exists = pattern.test(request.body.Body);
    var existslist = pattern2.test(request.body.Body);
    var jobId = null
    
    console.log(request.body.From);

    var sql = "SELECT id FROM users WHERE mobNumber = " + request.body.From + ";"
    connection.query(sql, function (error, result) {
        console.log(result[0].id);

        if (existslist)
        {
            var sql = "SELECT jl.id, nameOfCompany, position, datePosted FROM ubhacking.JobListings jl WHERE jl.status <> 1 AND jl.postedBy <> " + result[0].id + ";"
            connection.query(sql, function (error, result) {
                console.log(result[0])
                // twiml.message(result)  
            })

        } else if(exists){
            console.log("Push Received");
            var jobId = request.body.Body.split(" ")[1];
            if (jobId != null) {
                var status = '0'
                var dt = dateTime.create()
                var dateOfApplication = dt.format('Y-m-d H:M:S');
                connection.query(
                    "INSERT INTO ubhacking.JobsApplied (uid, jlid, status, dateOfApplication) VALUES ( '"+ result[0].id +"' ,'" + jobId + "','" + status +"' ,'" + dateOfApplication + "');", 
                    (error, results) => {
                        if(error) throw error;
                })
                twiml.message("Thanks for applying to this job " + jobId);
            }
            else {
                twiml.message("Incorrect Format, Please Use: Push <JOBID>");
            }
        }
        else {
            twiml.message("Please Use: Push <JOBID> to apply for a job.")
        }
        response.writeHead(200, {'Content-Type': 'text/xml'});
        response.end(twiml.toString());
    })

    // var sql = "SELECT jl.id, nameOfCompany, position, datePosted FROM ubhacking.JobListings jl WHERE jl.status <> 1 AND jl.postedBy <>;"
    // connection.query(sql, function (error, result) {
    //     response.send({
    //         data: result
    //     });
    // })
})

// Create a user
app.post('/users/add', function(request, response){
    var name = request.body.name
    var major = request.body.major
    var degree = request.body.degree
    var graduationDate = request.body.graduationDate
    var role = request.body.role
    var bio = request.body.bio
    var mobNumber = request.body.mobNumber

    connection.query(
        "INSERT INTO ubhacking.Users (name, major, degree, graduationDate, role, bio, mobNumber) VALUES ( '"+ name +"' ,'" + major + "','" + degree +"' ,'" + graduationDate +"' ,'" + role +"' ,'" + bio + "' ,'" + mobNumber + "');", 
        (error, results) => {
            if(error) throw error;
            response.status(200).send('Successfully Added User to database');
    })
})

// Apply for a job - Alumni and Student
app.post('/jobs/apply', function(request, response){
    var uid = request.body.uid
    var jlid = request.body.jlid
    var status = '0'
    var dt = dateTime.create()
    var dateOfApplication = dt.format('Y-m-d H:M:S');

    connection.query(
        "INSERT INTO ubhacking.JobsApplied (uid, jlid, status, dateOfApplication) VALUES ( '"+ uid +"' ,'" + jlid + "','" + status +"' ,'" + dateOfApplication + "');", 
        (error, results) => {
            if(error) throw error;
            response.status(200).send('Successfully Added User to database');
    })
})

// Post a new job - Alumni
app.post('/jobs/add', function(request, response){
    var nameOfCompany = request.body.nameOfCompany
    var logo = request.body.logo
    var position = request.body.position
    var postedBy = request.body.postedBy
    var status = '0'
    var dt = dateTime.create();
    var datePosted = dt.format('Y-m-d H:M:S');
    // var uid = request.body.uid
    
    connection.query(
        "INSERT INTO ubhacking.JobListings (nameOfCompany, logo, position, postedBy, datePosted, status) VALUES ( '"+ nameOfCompany +"' ,'" + logo + "','" + position +"' ,'" + postedBy + "' ,'" + datePosted + "' ,'" + status + "');", 
        (error, results) => {
            if(error) throw error;
            connection.query(
                "INSERT INTO ubhacking.JobsPosted (uid, jlid) VALUES ( '"+ postedBy +"' ,'" + results.insertId + "');", 
                (error, results) => {
                    if(error) throw error;
                    response.status(200).send('Successfully Added User to database');
            })
    })
})

app.post('/:studentId/upload/resume', async(request, response) => {
    var studentId = request.params.studentId
    try {
        if(!request.files) {
            response.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let resume = request.files.resume;
            resume.mv('./uploads/' + resume.name);
            connection.query("INSERT INTO ubhacking.Resumes(uid, resume) VALUES ('" + studentId + "', '"+ resume.name +"');"), (error, results) => {
                if (error) throw error;
            }
            response.send({
                status: true,
                message: 'File successfully uploaded',
                data: {
                    name: resume.name,
                    mimetype: resume.mimetype,
                    size: resume.size
                }
            });
        }
    } catch (error) {
        response.status(500).send(error);
    }
})

app.get('/resume/get/:fileName', function(request, response){
    var fileName = request.params.fileName
    console.log(fileName);
    const file = __dirname + '/uploads/' + fileName;
    response.download(file); 
})

app.listen(port, () => {
    console.log(`App is running on port ${port}.`)
})