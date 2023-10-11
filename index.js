const express = require("express");
const mongoose = require("mongoose");
const User = require("./db/User");
const Product = require("./db/product");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");

// key define
const jwtKey = "e-comm";

// Middleware to parse JSON request body
app.use(express.json());

// cors issue
app.use(cors());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/e-comm");

// Routes
app.post("/register", async (req, res) => {
  try {
    let user = new User(req.body);
    console.log("User data to be saved:", user); //  debugging
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    console.log("User data saved:", result); //  debugging
    jwt.sign({ result }, jwtKey, (err, token) => {
      if (err) {
        res.send({
          result: "something went wrong.please try after sometime",
        });
      }
      res.send({ result, auth: token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving user data");
  }
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  try {
    if (req.body.email && req.body.password) {
      let user = await User.findOne(req.body).select("-password");

      if (user) {
        jwt.sign({ user }, jwtKey, (err, token) => {
          if (err) {
            res.send({
              result: "something went wrong.please try after sometime",
            });
          }
          res.send({ user, auth: token });
        });
      } else {
        res.send({ result: "No result found" });
      }
    } else {
      console.log("error");
    }
  } catch (err) {
    console.log(err);
  }
});

// add product data save route
app.post("/add-product", async (req, res) => {
  try {
    let product = new Product(req.body);
    console.log("product details to be saved", product);
    let result = await product.save();
    console.log("products details saved", result);
    res.send(result);
  } catch (err) {
    console.log("error while sending product details", err);
  }
});

// sending complete data to client-side
app.get("/products", async (req, res) => {
  try {
    let products = await Product.find();

    if (products.length > 0) {
      res.send(products);
    }
  } catch (err) {
    res.send({ result: "No products found" }, err);
  }
});

// deleting data from data base
app.delete("/product/:id", async (req, res) => {
  try {
    let result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
  } catch (err) {
    res.send({ result: "data not found" });
  }
});

// get data from database with particular id base and send to client-side.
app.get("/product/:id", async (req, res) => {
  try {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
      res.send(result);
    }
  } catch (err) {
    res.send({ res: "No data found" });
  }
});

// update user requested data & send
app.put("/product/:id", async (req, res) => {
  try {
    let result = await Product.updateOne(
      { _id: req.params.id },
      {
        $set: req.body,
      }
    );
    res.send(result);
    console.log(req.body);
  } catch (err) {
    res.send("No data updated");
  }
});

// search

app.get("/search/:key", async (req, res) => {
  try {
    let result = await Product.find({
      // searching more than one field $or required
      $or: [
        { name: { $regex: req.params.key } }, // regex standardize text
        { price: { $regex: req.params.key } }, // regex standardize text
        { category: { $regex: req.params.key } }, // regex standardize text
        { company: { $regex: req.params.key } }, // regex standardize text
      ],
    });
    res.send(result);
  } catch (err) {}
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

// checking DB connected or not
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
