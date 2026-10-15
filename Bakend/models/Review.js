
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5.",
      },
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user for each book.
reviewSchema.index(
  { book: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);
