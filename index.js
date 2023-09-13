const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

AWS.config.update({
  accessKeyId: 'AKIARJFTBYL2S44ICBWT',
  secretAccessKey: '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',
  region: 'ap-southeast-2',
});

const s3 = new AWS.S3();

// Set up Multer for file uploads
const storage = multer.memoryStorage();({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Define a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
  res.setHeader('Content-Type', 'application/javascript');
});

app.post('/upload', upload.single('file'), (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).send('No file uploaded.');
  }

  // Define parameters for uploading to S3
  const params = {
    Bucket: 'cloud-assignment-07',
    Key: uploadedFile.originalname,
    Body: uploadedFile.buffer, // Use the file buffer as the body
  };

  // Upload the file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).send('Error uploading file to S3.');
    }

    console.log('File uploaded successfully to S3:', data.Location);
    // You can optionally perform further actions here, such as updating your website UI.

    res.send('File uploaded successfully.');
  });
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
  res.setHeader('Content-Type', 'application/javascript');
});

app.get('/retrieveFiles', (req, res) => {


  const params = {
    Bucket: 'cloud-assignment-07'
  };


  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.error('Error listing objects in S3:', err);
      res.status(500).send('An error occurred while retrieving files.');
    } else {
      const files = data.Contents.map(file => ({
        name: file.Key, // File name
        url: `https://${params.Bucket}.s3.amazonaws.com/${file.Key}`, // S3 file URL
      }));

      const fileLinks = files.map(file => `
        <div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
          <a href="${file.url}" target="_blank" style="text-decoration: none; color: #007bff; margin-right: 100px;">${file.name}</a>
        </div>
      `);

      // Create a heading with the formatted category name
      const heading = `<h1 style ="text-align: center">My Files</h1>`;

      // Wrap the content in a centered div
      const centeredContent = `
        <div style="display: flex; justify-content: center; align-items: center;">
          <div>
            ${heading}
            ${fileLinks.join('<br>')}
          </div>
        </div>
      `;

      res.send(centeredContent);
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});