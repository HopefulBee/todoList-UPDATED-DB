//Required Modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

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
  //New Model
  const Item = mongoose.model("Item", itemsSchema);
  const item1 = new Item({
    name: "Hit the + button to add a list"
  });
  const item2 = new Item({
    name: "<--- Hit the checkbox to delete"
  });
  const defaultItems = [item1, item2];

  //List Schema
  const listSchema = {
    name: String,
    items: [itemsSchema]
  }
  const List = mongoose.model("List", listSchema);

  app.get("/", function (req, res) {
     Item.find({}).then(async foundItems => {
      if (foundItems.length=== 0) {
        await Item.insertMany(defaultItems);
        res.redirect("/");
      }
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    });
    
  });

  app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }).then(async foundList => {
      if (!foundList) {
              //Create a new list
              const list = new List({
                name: customListName,
                items: defaultItems
              });
              await list.save();
              res.redirect("/" + customListName)
            } else {
              //Show existing list
              res.render("list", { listTitle: foundList.name, newListItems: foundList.items})
         }
      });
  });

  //Post Request on the Home Route
  app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
      name: itemName
    });
    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
     List.findOne({ name: listName }).then(async foundList => {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      });
    }
  });

  //Deletes a checked box and refreshes the page
  app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
      //findByIdAndRemove doesn't work
      Item.findByIdAndDelete(checkedItemId).exec();
      res.redirect("/");
    } else {
      List.findOneAndUpdate( 
        {name: listName}, 
        {$pull: {items: {_id: checkedItemId}}})
        .then(foundList => {
          res.redirect("/" + listName);
        });
    }
  });

  //Server Check
  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}
