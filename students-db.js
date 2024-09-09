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

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());
app.use(limiter);

// Create table if not exists
db.run('CREATE TABLE IF NOT EXISTS student(sname TEXT, class TEXT, rollNo TEXT PRIMARY KEY, birthDate TEXT)');

// Load default page
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './public/add-student.html'));
});

// Insert a new student
app.post('/add', function (req, res) {
    db.serialize(() => {
        db.run('INSERT INTO student(sname, class, rollNo, birthDate) VALUES(?, ?, ?, ?)',
            [req.body.sname, req.body.class, req.body.rollNo, req.body.birthDate], function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send("Error adding student.");
                }
                console.log("New student has been added");
                res.send("New student has been added into the database with\nRoll no. = " + req.body.rollNo + " \nName = " + req.body.sname + " \nClass = " + req.body.class + "\nDate of Birth = " + req.body.birthDate);
            });
    });
});

// View a student's details
app.get('/view', function (req, res) {
    const rollNo = req.query.rollNo;

    if (!rollNo) {
        return res.status(400).send("Roll number is required.");
    }

    db.get('SELECT rollNo AS ROLLNO, class AS CLASS, sname AS SNAME, birthDate AS BIRTHDATE FROM student WHERE rollNo = ?',
        [rollNo], function (err, row) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Error retrieving student details.");
            }

            if (row) {
                res.send(`ID: ${row.ROLLNO}\nName: ${row.SNAME}\nClass: ${row.CLASS}\nDate of Birth: ${row.BIRTHDATE}`);
                console.log("Entry displayed successfully");
            } else {
                res.send("No student found with the provided roll number.");
            }
        });
});

// Modify a student's details
app.post('/modify', function (req, res) {
    const { rollNo, sname, class: studentClass, birthDate } = req.body;

    if (!rollNo) {
        return res.status(400).send("Roll number is required to modify.");
    }

    db.serialize(() => {
        const query = `UPDATE student SET sname = COALESCE(?, sname), class = COALESCE(?, class), birthDate = COALESCE(?, birthDate) WHERE rollNo = ?`;
        db.run(query, [sname, studentClass, birthDate, rollNo], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Error modifying student details.");
            }

            if (this.changes > 0) {
                res.send("Student details updated successfully.");
            } else {
                res.send("No student found with the provided roll number.");
            }
        });
    });
});

// Delete a student
app.post('/delete', function (req, res) {
    const rollNo = req.body.rollNo;

    if (!rollNo) {
        return res.status(400).send("Roll number is required to delete.");
    }

    db.serialize(() => {
        db.run('DELETE FROM student WHERE rollNo = ?', [rollNo], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Error deleting student.");
            }

            if (this.changes > 0) {
                res.send("Student deleted successfully.");
            } else {
                res.send("No student found with the provided roll number.");
            }
        });
    });
});

// Close the database
app.get('/close', function (req, res) {
    db.close((err) => {
        if (err) {
            res.status(500).send('Error closing the database.');
            return console.error(err.message);
        }
        console.log('Database connection successfully closed');
        res.send('Database connection successfully closed');
    });
});

// Run server
server.listen(3000, function () {
    console.log("Server listening on port: 3000");
});
