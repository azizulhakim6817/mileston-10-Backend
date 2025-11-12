const express = require("express");
require("dotenv").config();
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//middlware ---------------------------------------
const logger = (req, res, next) => {
  console.log("logging info");
  next();
};

// firebase admin -----------------
const serviceAccount = require("./smart-deals-firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//firebase medilware ------------------------------------
const verifyFireBaseToken = async (req, res, next) => {
  //console.log("In the verify middleware", req.headers.authrization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthrize access!" });
  }

  const token = req.headers.authorization.split(` `)[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access!-" });
  }
  //admin ---------------
  try {
    const userTokenInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userTokenInfo.email;
    console.log("After token validation", userTokenInfo);
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized access!" });
  }

  //verify token ------------------
};

//! Database -----------------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.aramfem.mongodb.net/smart-server-db`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("smart_db");
    const productsCollection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const userCollection = db.collection("users");

    //! create user ----------------------------------
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      const email = req.body.email;
      const query = { email: email };

      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "User already exist. don't need to insert again" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    //* latest product------------------------
    app.get("/latest-products", async (req, res) => {
      const cursor = productsCollection.find().sort({ created_at: 1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    //! products--------------------------------
    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    //!get products-----------------------------------
    /*    app.get("/product", async (req, res) => {
      //const projectFields = { title: 1, price_min: 1, imge: 1 };
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = await productsCollection
        .find(query)
        .sort({ price_min: 1 })
        .limit(4)
        .skip(3);
      //.project(projectFields);
      const result = await cursor.toArray();
      res.send(result);
    }); */

    //! email get products----------------------------
    app.get("/product", async (req, res) => {
      //const projectFields = { title: 1, price_min: 1, imge: 1 };
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = await productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //! single product ------------------------------
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    //!update product -------------------------------
    app.patch("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updateProduct.name,
          price: updateProduct.price,
        },
      };
      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    //!delete product --------------------------------
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    //!! bids get------------------------------------
    app.get("/bids", logger, verifyFireBaseToken, async (req, res) => {
      //console.log(req.headers);
      const email = req.query.email;
      const query = {};
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "forbiden access" });
        }
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //!! bids post ---------------------------------------
    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    //! product bids------------------------------------------
    app.get(
      "/product/bids/:productId",
      verifyFireBaseToken,
      async (req, res) => {
        const productId = req.params.productId;
        const query = { product: productId };
        const cursor = bidsCollection.find(query).sort({ bid_price: 1 });
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    //! bids delete --------------------------------------------
    app.delete("/bids-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Server is running");
});

// client
//   .connect()
//   .then(() => {
//     app.listen(port, () => {
//       console.log(`Server is running ${port}`);
//     });
//   })
//   .catch(console.dir);
