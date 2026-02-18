const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'submissions.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Save a new submission
app.post('/api/submit', (req, res) => {
    const newEntry = req.body;
    newEntry.id = Date.now();
    newEntry.timestamp = new Date().toISOString();

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        const submissions = JSON.parse(data || '[]');
        submissions.push(newEntry);
        fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving data');
            res.status(200).send({ message: 'Success', entry: newEntry });
        });
    });
});

// Get all submissions for the admin
app.get('/api/submissions', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading data');
        res.status(200).send(JSON.parse(data || '[]'));
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
