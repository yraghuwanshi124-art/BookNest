const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const User = require("./models/User");
const Book = require("./models/Book");
const bcrypt = require("bcryptjs");
const Review = require("./models/Review");




const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message));
  

app.get("/", (req, res) => {
  res.send("Welcome to BookNest Backend!");
});


app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Fetch books error:", error.message);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});


app.post("/api/books", verifyToken, async (req, res) => {
  try {
    const { title, author, description, category } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        message: "Title and author are required",
      });
    }

    const book = new Book({
      title,
      author,
      description,
      category: category || "Fiction",
      addedBy: req.userId,
    });

    await book.save();

    return res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    console.error("Add book error:", error);

    return res.status(500).json({
      message: "Failed to add book",
    });
  }
});



app.delete("/api/books/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      addedBy: req.userId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found or you cannot delete this book",
      });
    }

    await Review.deleteMany({ book: book._id });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete book error:", error.message);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

app.post("/api/books/:bookId/reviews", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be from 1 to 5" });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = await Review.create({
      book: bookId,
      user: req.userId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this book",
      });
    }

    console.error("Review error:", error.message);
    res.status(500).json({ message: "Failed to submit review" });
  }
});


app.get("/api/books/:bookId/reviews", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const reviews = await Review.find({ book: bookId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Fetch reviews error:", error.message);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


app.get("/api/books/:bookId/rating", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const result = await Review.aggregate([
      {
        $match: {
          book: new mongoose.Types.ObjectId(bookId),
        },
      },
      {
        $group: {
          _id: "$book",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    res.json(
      result.length
        ? {
            averageRating: Number(result[0].averageRating.toFixed(1)),
            totalReviews: result[0].totalReviews,
          }
        : { averageRating: 0, totalReviews: 0 }
    );
  } catch (error) {
    console.error("Rating error:", error.message);
    res.status(500).json({ message: "Failed to calculate rating" });
  }
});


app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({
      message: "Server error during signup",
    });
  }
});

const jwt = require("jsonwebtoken");


function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please login first",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}


app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Server error during login",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});