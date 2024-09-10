const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const db = new sqlite3.Database('./database/students.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS student (sname TEXT, class TEXT, rollNo TEXT PRIMARY KEY, birthDate TEXT)', (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/add-student.html'));
});

app.post('/add', (req, res) => {
    const { sname, class: studentClass, rollNo, birthDate } = req.body;

    if (!sname || !studentClass || !rollNo || !birthDate) {
        return res.status(400).send("All fields are required.");
    }

    db.run('INSERT INTO student (sname, class, rollNo, birthDate) VALUES (?, ?, ?, ?)', 
        [sname, studentClass, rollNo, birthDate], 
        function (err) {
            if (err) {
                console.error('Error inserting student:', err.message);
                return res.status(500).send("Error adding student.");
            }
            res.send(`New student added with Roll no. = ${rollNo}, Name = ${sname}, Class = ${studentClass}, Date of Birth = ${birthDate}`);
        }
    );
});

app.get('/view', (req, res) => {
    const { rollNo } = req.query;

    if (!rollNo) {
        return res.status(400).send("Roll number is required.");
    }

    db.get('SELECT rollNo AS ROLLNO, class AS CLASS, sname AS SNAME, birthDate AS BIRTHDATE FROM student WHERE rollNo = ?', 
        [rollNo], 
        (err, row) => {
            if (err) {
                console.error('Error retrieving student details:', err.message);
                return res.status(500).send("Error retrieving student details.");
            }

            if (row) {
                res.send(`ID: ${row.ROLLNO}\nName: ${row.SNAME}\nClass: ${row.CLASS}\nDate of Birth: ${row.BIRTHDATE}`);
            } else {
                res.send("No student found with the provided roll number.");
            }
        }
    );
});

app.post('/modify', (req, res) => {
    const { rollNo, sname, class: studentClass, birthDate } = req.body;

    if (!rollNo) {
        return res.status(400).send("Roll number is required to modify.");
    }

    const query = `UPDATE student SET sname = COALESCE(?, sname), class = COALESCE(?, class), birthDate = COALESCE(?, birthDate) WHERE rollNo = ?`;
    db.run(query, [sname, studentClass, birthDate, rollNo], function (err) {
        if (err) {
            console.error('Error modifying student details:', err.message);
            return res.status(500).send("Error modifying student details.");
        }

        if (this.changes > 0) {
            res.send("Student details updated successfully.");
        } else {
            res.send("No student found with the provided roll number.");
        }
    });
});

app.post('/delete', (req, res) => {
    const { rollNo } = req.body;

    if (!rollNo) {
        return res.status(400).send("Roll number is required to delete.");
    }

    db.run('DELETE FROM student WHERE rollNo = ?', [rollNo], function (err) {
        if (err) {
            console.error('Error deleting student:', err.message);
            return res.status(500).send("Error deleting student.");
        }

        if (this.changes > 0) {
            res.send("Student deleted successfully.");
        } else {
            res.send("No student found with the provided roll number.");
        }
    });
});

app.get('/close', (req, res) => {
    db.close((err) => {
        if (err) {
            res.status(500).send('Error closing the database.');
            console.error('Error closing the database:', err.message);
        } else {
            console.log('Database connection successfully closed');
            res.send('Database connection successfully closed');
        }
    });
});

app.get('/students', (req, res) => {
    const studentsByClass = {};

    db.all('SELECT sname, class, rollNo, birthDate FROM student', [], (err, rows) => {
        if (err) {
            console.error('Error retrieving students:', err.message);
            return res.status(500).send("Error retrieving student data.");
        }

        rows.forEach(row => {
            if (!studentsByClass[row.class]) {
                studentsByClass[row.class] = [];
            }
            studentsByClass[row.class].push({
                sname: row.sname,
                rollNo: row.rollNo,
                birthDate: row.birthDate
            });
        });

        res.json(studentsByClass);
    });
});

// Add this to your existing routes in index.js

// Create a table for student marks
db.run('CREATE TABLE IF NOT EXISTS marks (rollNo TEXT, subject TEXT, marks INTEGER, FOREIGN KEY(rollNo) REFERENCES student(rollNo))', (err) => {
    if (err) {
        console.error('Error creating marks table:', err.message);
    }
});

// Route to add marks
app.post('/add-marks', (req, res) => {
    const { rollNo, subject, marks } = req.body;

    if (!rollNo || !subject || marks === undefined) {
        return res.status(400).send("All fields are required.");
    }

    db.run('INSERT INTO marks (rollNo, subject, marks) VALUES (?, ?, ?)', 
        [rollNo, subject, marks], 
        function (err) {
            if (err) {
                console.error('Error inserting marks:', err.message);
                return res.status(500).send("Error adding marks.");
            }
            res.send(`Marks added for Roll No. = ${rollNo}, Subject = ${subject}, Marks = ${marks}`);
        }
    );
});

// Route to get marks for a student
app.get('/get-marks', (req, res) => {
    const { rollNo } = req.query;

    if (!rollNo) {
        return res.status(400).send("Roll number is required.");
    }

    db.all('SELECT subject, marks FROM marks WHERE rollNo = ?', 
        [rollNo], 
        (err, rows) => {
            if (err) {
                console.error('Error retrieving marks:', err.message);
                return res.status(500).send("Error retrieving marks.");
            }

            if (rows.length > 0) {
                res.json(rows);
            } else {
                res.send("No marks found for the provided roll number.");
            }
        }
    );
});


server.listen(3000, () => {
    console.log("Server listening on port 3000");
});
