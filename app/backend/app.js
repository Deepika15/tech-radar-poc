const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

const blipRouter = require('./routes/blip.route');
const accountRouter = require('./routes/account.route');

const port = process.env.PORT || 5000;

const app = express();

require('dotenv').config();

app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
const promise = mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/test?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// For Dev, forcing to  connect via this Endpoint
// previously it tried to map mongodb:27017 as host, but locally, this path made no sense
// const promise = mongoose.connect('mongodb://admin:password@localhost:27017/test?authSource=admin', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// ----------------------

const connection = mongoose.connection;
mongoose.plugin((schema) => {
  schema.pre("findOneAndUpdate", setRunValidators);
  schema.pre("updateMany", setRunValidators);
  schema.pre("updateOne", setRunValidators);
  schema.pre("update", setRunValidators);
});

function setRunValidators() {
  this.setOptions({ runValidators: true });
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/blip', blipRouter);
app.use('/auth', accountRouter);

connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
  console.log(process.env.MONGO_URL);
});

app.use(function(req, res, next) {
  next(createError(404));
});


module.exports = app;
