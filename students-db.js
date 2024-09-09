            // Load modules
            var sqlite3 = require('sqlite3').verbose();
            var express = require('express');
            var http = require('http');
            var path = require("path");
            var bodyParser = require('body-parser');
            var helmet = require('helmet');
            var rateLimit = require("express-rate-limit");

            var app = express();
            var server = http.createServer(app);

            const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
            });


            // Create database
            var db = new sqlite3.Database('./database/students.db');

            app.use(bodyParser.urlencoded({extended: false}));
            app.use(express.static(path.join(__dirname,'./public')));
            app.use(helmet());
            app.use(limiter);

            // Run database
            db.run('CREATE TABLE IF NOT EXISTS student(sname TEXT, class TEXT, rollNo TEXT, birthDate TEXT)');


            // Load default page
            app.get('/', function(req,res){
            res.sendFile(path.join(__dirname,'./public/add-student.html'));
            });

            // Insert
            app.post('/add', function(req,res){
            db.serialize(()=>{
                db.run('INSERT INTO student(sname, class, rollNo, birthDate) VALUES(?,?,?,?)',
                [req.body.sname, req.body.class, req.body.rollNo, req.body.birthDate], function(err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log("New student has been added");
                res.send("New student has been added into the database with roll no. = "
                    + req.body.rollNo+ " and Name = " + req.body.sname);
                });
            });
            });


            // View database
            // View database
            app.get('/view', function(req, res) {
                const rollNo = req.query.rollNo; // Use query parameter for GET request
            
                db.get('SELECT rollNo AS ROLLNO, class AS CLASS, sname AS SNAME, birthDate AS BIRTHDATE FROM student WHERE rollNo = ?',
                [rollNo], function(err, row) {
                    if (err) {
                    res.send("Error encountered while displaying");
                    console.error(err.message);
                    return;
                    }
            
                    if (row) {
                    res.send(`ID: ${row.ROLLNO}, Name: ${row.SNAME}, Class: ${row.CLASS}, Date of Birth: ${row.BIRTHDATE}`);
                    console.log("Entry displayed successfully");
                    } else {
                    res.send("No student found with the provided roll number.");
                    }
                });
            });
            
            // Close database
            app.get('/close', function(req,res){
            db.close((err) => {
                if (err) {
                res.send('There is some error in closing the database');
                return console.error(err.message);
                }
                console.log('Closing the database connection.');
                res.send('Database connection successfully closed');
            });
            });


            //Run server
            server.listen(3000,function(){ 
                console.log("Server listening on port: 3000");
            });