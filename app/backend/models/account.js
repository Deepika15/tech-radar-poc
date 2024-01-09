const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const accountSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username required"],
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: [true, "Password required"],
      trim: true,
      minlength: 3,
    },
    accountType: {
      type: String,
      enum: ['ADMIN', 'EDITOR'],
      required: [true, "Account type required"],
      trim: true,
  },
  },
  {
    timestamps: true,
  }
);

accountSchema.methods.validPassword = function (password) {
  return this.password.localeCompare(password);
};

accountSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  bcrypt.hash(this.password, 10, (error, hash) => {
    if (error) {
      return next(error);
    }
    this.password = hash;
    next();
  });
});

accountSchema.pre("findOneAndUpdate", async function () {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (typeof this._update.password !== "undefined" && this._update.hasOwnProperty('password')) {
    if (docToUpdate.password !== this._update.password) {
      const newPassword = await bcrypt.hash(this._update.password, 10);
      this._update.password = newPassword;
    }
  } else {
      this._update.password = docToUpdate.password;
  }
});


accountSchema.methods.checkPassword = function (incPassword, cb) {
  bcrypt.compare(incPassword, this.password, (error, isCorrect) => {
    if (error) {
      return cb(error);
    } else {
      if (!isCorrect) {
        return cb(null, isCorrect);
      }
      return cb(null, this);
    }
  });
};

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
