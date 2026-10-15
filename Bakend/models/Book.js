
const mongoose = require("mongoose");

const BOOK_CATEGORIES = [
  "Fiction",
  "Science",
  "Technology",
  "Mystery",
  "Fantasy",
  "Biography",
  "Self-Help",
];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required."],
      trim: true,
      maxlength: 140,
    },

    author: {
      type: String,
      required: [true, "Author is required."],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },

    category: {
      type: String,
      enum: {
        values: BOOK_CATEGORIES,
        message: "Please select a valid book category.",
      },
      default: "Fiction",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);
