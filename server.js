const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json()); // For parsing application/json

// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'login',
  password: '#Wry1234',
  database: 'student3' // Keep this as 'student2' for database connection
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Create or modify the students3 table
const createStudents3TableQuery = `
  CREATE TABLE IF NOT EXISTS students3 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    faculty VARCHAR(255),
    login_time TIMESTAMP NULL,
    logout_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createStudents3TableQuery, (err) => {
  if (err) {
    console.error('Error creating students3 table:', err);
    return;
  }
  console.log('students3 table created successfully');
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Register a new user
app.post('/register', (req, res) => {
  const { roll_number, name, email, faculty } = req.body;

  console.log('Received data:', { roll_number, name, email, faculty });

  const checkExistingQuery = 'SELECT * FROM students3 WHERE roll_number = ?';
  db.query(checkExistingQuery, [roll_number], (err, results) => {
    if (err) {
      console.error('Error checking existing student:', err);
      return res.status(500).send({ message: 'Error registering user', error: true });
    }

    if (results.length > 0) {
      return res.status(400).send({ message: 'Student with this roll number already exists', error: true });
    }

    const insertQuery = 'INSERT INTO students3 (roll_number, name, email, faculty) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [roll_number, name, email, faculty], (err) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).send({ message: 'Error registering user', error: true });
      }

      console.log('Data inserted successfully');

      // Send email using SMTP
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'aarthicorelab@gmail.com',
          pass: 'Aarthi@corelab15'
        }
      });

      const mailOptions = {
        from: 'aarthicorelab@gmail.com',
        to: email,
        subject: 'Registration Verification',
        text: `Hello ${name},\n\nThank you for registering!`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      res.send({ message: 'User registered successfully', success: true });
    });
  });
});

// Check if the user exists and get their status
app.post('/check_student', (req, res) => {
  const { roll_number } = req.body;

  console.log('Received data:', { roll_number });

  const selectQuery = 'SELECT * FROM students3 WHERE roll_number = ?';
  
  db.query(selectQuery, [roll_number], (err, results) => {
    if (err) {
      console.error('Error selecting data:', err);
      return res.status(500).send({ message: 'Error checking student', error: true });
    }
    
    if (results.length > 0) {
      const user = results[0];
      if (user.login_time && !user.logout_time) {
        return res.send({ message: 'Student logged in, needs to logout', success: true, needsLogout: true });
      } else {
        return res.send({ message: 'Student found, can login', success: true, canLogin: true });
      }
    } else {
      return res.status(404).send({ message: 'Student not found', error: true });
    }
  });
});

// Login a user
app.post('/login', (req, res) => {
  const { roll_number } = req.body;

  console.log('Received data:', { roll_number });

  const selectQuery = 'SELECT id, login_time FROM students3 WHERE roll_number = ?';
  db.query(selectQuery, [roll_number], (err, results) => {
    if (err) {
      console.error('Error selecting student:', err);
      return res.status(500).send({ message: 'Error logging in', error: true });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'Student not found', error: true });
    }

    const studentId = results[0].id;
    const updateQuery = 'UPDATE students3 SET login_time = NOW(), logout_time = NULL WHERE id = ?';
    db.query(updateQuery, [studentId], (err) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.status(500).send({ message: 'Error logging in', error: true });
      }
      res.send({ message: 'Login successful', success: true });
    });
  });
});

// Logout a user
app.post('/logout', (req, res) => {
  const { roll_number } = req.body;

  console.log('Received data:', { roll_number });

  const updateQuery = 'UPDATE students3 SET logout_time = NOW(), login_time = NULL WHERE roll_number = ? AND logout_time IS NULL';
  
  db.query(updateQuery, [roll_number], (err) => {
    if (err) {
      console.error('Error updating logout time:', err);
      return res.status(500).send({ message: 'Error logging out', error: true });
    }
    res.send({ message: 'Logout successful', success: true });
  });
});

// Serve the HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'Registration.html'));
});

// Start the server
const port = 3005;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

