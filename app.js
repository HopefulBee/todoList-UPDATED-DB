//Required Modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

//Set and Use
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Mongoose Database
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/listDB');

  //Item Schema
  const itemsSchema = new mongoose.Schema({
    name: String
  });
  const Item = mongoose.model("Item", itemsSchema);
  const item1 = new Item({
    name: "Prepare Documents for Mr. Darren"
  });
  const item2 = new Item({
    name: "Print documents and fax it"
  });
  const defaultItems = [item1, item2];
  const listSchema = {
    name: String,
    items: [itemsSchema]
  }

  //List Schema
  const List = mongoose.model("List", listSchema);
  app.get("/", async function (req, res) {
    const day = date.getDate();
    const foundItems = await Item.find();
    if (foundItems === 0) {
      await Item.insertMany(defaultItems);
    }
    res.render("list", { listTitle: day, newListItems: foundItems });
  });

  app.get("/:customListName", async (req, res) => {
    const customListName = req.params.customListName;
    //Checking to see if a name already exists in our collection of list
    //If it exists, it won't save
    //If it doesn't, a new one would be created
    //Did not work
    // await List.findOne({ name: customListName });
    // console.log(customListName);
    // (err, foundList) => {
    //     if (!foundList) {
    //       console.log("Doesn't Exist");
    //     } else {
    //       console.log("Exists");
    //  }
    // }
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    await list.save();
  });

  //Post Request on the Home Route
  app.post("/", async function (req, res) {
    const itemName = req.body.newItem;
    const item = new Item({
      name: itemName
    });
    await item.save();
    res.redirect("/");
  });

  //Deletes a checked box and refreshes the page
  app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    //findByIdAndRemove doesn't work
    Item.findByIdAndDelete(checkedItemId).exec();
    res.redirect("/");
  });

  //Server Check
  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}

// app.get("/about", function (req, res) {
//   res.render("about");
// });
