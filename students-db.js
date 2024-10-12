const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
});

// Load admin password from file
let adminPassword = "welcome1234"; // Default password
const passwordFilePath = path.join(__dirname, 'admin_password.txt');

// Check if password file exists and read it
if (fs.existsSync(passwordFilePath)) {
    adminPassword = fs.readFileSync(passwordFilePath, 'utf8').trim();
} else {
    // If the file doesn't exist, create it with the default password
    fs.writeFileSync(passwordFilePath, adminPassword);
}

const db = new sqlite3.Database(process.env.DB_PATH || './database/students.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());
app.use(limiter);

// Create tables if they do not exist
db.run('CREATE TABLE IF NOT EXISTS student (sname TEXT, class TEXT, rollNo TEXT PRIMARY KEY, birthDate TEXT)');
db.run('CREATE TABLE IF NOT EXISTS marks (rollNo TEXT, subject TEXT, marks INTEGER, PRIMARY KEY (rollNo, subject), FOREIGN KEY(rollNo) REFERENCES student(rollNo))');

// Login endpoint
app.post('/login', (req, res) => {
    const { password } = req.body;

    if (password === adminPassword) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Incorrect password!" });
    }
});

// Get all students
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
                birthDate: row.birthDate,
                class: row.class
            });
        });

        res.json(studentsByClass);
    });
});

// Add student
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

// View student details
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

// Modify student details
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

// Delete student
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

// Add marks for a student
app.post('/add-marks', (req, res) => {
    const marksEntries = req.body;
    const rollNo = marksEntries.rollNo;

    console.log('Received marks data:', marksEntries);

    // First, check if the student exists
    db.get('SELECT * FROM student WHERE rollNo = ?', [rollNo], (err, row) => {
        if (err) {
            console.error('Error checking student existence:', err);
            return res.status(500).send("Error checking student record.");
        }
        if (!row) {
            return res.status(400).send("No student found with the provided roll number.");
        }

        const insertMarksPromises = Object.entries(marksEntries).map(([subject, marks]) => {
            if (subject === 'rollNo') return Promise.resolve();
            return new Promise((resolve, reject) => {
                db.run('INSERT INTO marks (rollNo, subject, marks) VALUES (?, ?, ?) ON CONFLICT(rollNo, subject) DO UPDATE SET marks = ?',
                    [rollNo, subject, marks, marks],
                    function (err) {
                        if (err) {
                            console.error('Error adding marks for subject:', subject, 'Error:', err.message);
                            return reject(err);
                        }
                        resolve();
                    });
            });
        });

        Promise.all(insertMarksPromises)
            .then(() => {
                res.send(`Marks added successfully for roll no: ${rollNo}`);
            })
            .catch((err) => {
                console.error('Error adding marks:', err.message);
                res.status(500).send("Error adding marks.");
            });
    });
});

// Get marks for a specific student
app.get('/marks', (req, res) => {
    const { rollNo } = req.query;

    if (!rollNo) {
        return res.status(400).send("Roll number is required.");
    }

    db.all('SELECT subject, marks FROM marks WHERE rollNo = ?', [rollNo], (err, rows) => {
        if (err) {
            console.error('Error retrieving marks:', err.message);
            return res.status(500).send("Error retrieving marks.");
        }

        res.json(rows);
    });
});

// Get student results
app.post('/get-result', (req, res) => {
    const { rollNo } = req.body;

    if (!rollNo) {
        return res.status(400).send("Roll number is required.");
    }

    db.all('SELECT subject, marks FROM marks WHERE rollNo = ?', [rollNo], (err, rows) => {
        if (err) {
            console.error('Error retrieving marks:', err.message);
            return res.status(500).send("Error retrieving results.");
        }

        if (rows.length > 0) {
            // Create a simple HTML structure for the results
            let resultHTML = `
                <html>
                    <head>
                        <title>Student Results</title>
                        <link rel="stylesheet" href="result-styles.css">
                    </head>
                    <body>
                        <h1>Results for Roll No: ${rollNo}</h1>
                        <table>
                            <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                            </tr>`;
            rows.forEach(row => {
                resultHTML += `
                    <tr>
                        <td>${row.subject}</td>
                        <td>${row.marks}</td>
                    </tr>`;
            });
            resultHTML += `
                        </table>
                    </body>
                </html>`;
            res.send(resultHTML);
        } else {
            res.send("No marks found for the provided roll number.");
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Existing code ...

// Add this close endpoint
app.get('/close', (req, res) => {
    res.send("Server is shutting down...");
    server.close(() => {
        console.log("Server closed");
        process.exit(0); // Exit the process
    });
});


