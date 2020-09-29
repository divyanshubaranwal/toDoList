const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Giving a database connection using mongoose
mongoose.connect("mongodb+srv://Admin-divs:abcde@cluster0.p7h3u.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

//creating an item-schema using mongoose
const itemSchema = new mongoose.Schema({
    task : String
});

const listSchema = new mongoose.Schema({
    name : String,
    items: [itemSchema]
});

//creating a new table/model/collection
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

//creating 3 new items which are fit to be placed in collection "Item"
const add = new Item({
    task : "Press + to add."
});
const deleteItem = new Item({
    task : "Tick checkbox to delete."
});

//insertMany requires an array of items of a certain collection type
const defaultItems = [add, deleteItem];
var day = new Date();
app.get("/", function (req, res) {
    let today = new Date();
    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };
    day = today.toLocaleDateString('en-US', options);

    Item.find({}, function(err, results) {
        if(results.length === 0){
            Item.insertMany(defaultItems, function(err) {
                if(err){
                    console.log(err);
                }else{
                    console.log("default items are inserted.");
                }
            });
            res.redirect("/");
        }else{
            res.render("dayList", {listTitle : day, newTasks: results});
        }
    });
});

app.get("/lists/:customListName", function(req, res) {
    let title = _.capitalize(req.params.customListName);
    List.findOne({name: title}, function(error, results) {
        if(!error){
            if(results != null){
                console.log("List already exists");
                res.render("dayList", {listTitle : results.name, newTasks: results.items});
            }
            else{
                const list = new List({
                    name: title,
                    items: defaultItems
                });
            
                list.save();
                console.log("It's a new day. So, a new list");
                console.log("Inserted list : " + list.name);
                res.render("dayList", {listTitle : list.name, newTasks: list.items});
            }
        }
    });
    
});

app.post("/", function(req, res) {
    let taskName = req.body.task;
    let title = req.body.list;

    const newItem = new Item({
        task : taskName
    });

    if(title == day){
        newItem.save();
        res.redirect("/");
    }
    else{
        List.findOne({name : title}, function(err, results) {
            results.items.push(newItem);
            results.save();
            res.redirect("/lists/" + title);
        })
    }
});

app.post("/delete", function(req, res) {
    var _id = req.body.checkbox;
    const listName = req.body.listName;
    console.log(listName);

    if(listName == day){
        Item.findByIdAndRemove(_id, function(e){
            if(e){
                console.log(e);
            }
            else{
                console.log("Successfully deleted the item with _id : " + _id);
            }
        });
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : _id}}}, function(err, results) {
            if(!err){
                res.redirect("/lists/" + listName);
            }
        })
    }
    
});

// app.get("/work", function(req, res) {
//     res.render("dayList", {nameOfDay : "Work List", newTasks: []})
// });
//This is not accessible because form-action is "/"
// app.post("/work", function(req, res) {
//     res.redirect("/work");
// })

app.listen(3000, function() {
    console.log("Server is hosted on port 3000.");
})