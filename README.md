1.  const result = await cursor.toArray();

2.  const id = req.params.id;
    const query = { \_id: new ObjectId(id) };

3.  const cursor = await productsCollection.find().sort({ price_min: 1 }); // 1,2,3,4
    const cursor = await productsCollection.find().sort({ price_min: -1 }); // 4,3,2,1

4.  sort, limit, skip : -------------
    const cursor = await productsCollection.find().sort({ price_min: 1 }).limit(4).skip(3);

5.  //get products----------------------------------------
    app.get("/product", async (req, res) => {
    //const projectFields = { \_id: 0, title: 1, price_min: 1, imge: 1 };
    const cursor = await productsCollection
    .find()
    .sort({ price_min: 1 })
    .limit(4)
    .skip(3);
    //.project(projectFields);
    const result = await cursor.toArray();
    res.send(result);
    });

6.  http://localhost:3000/product/category=electronics&price=3009
    ->> product?key=value&key=value
    ->> GET /products?email=seller1@example.com

7. 1  //!get products----------------------------------------
     app.get("/product", async (req, res) => {
    const projectFields = { title: 1, price_min: 1, imge: 1 };
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
    }); 


   7. 1  //! email get products----------------------------------------
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

8. 
    //!! bids get--------------------------------------
    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });