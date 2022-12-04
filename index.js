const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const serverless = require("serverless-http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose.connect("mongodbconnection", {useNewUrlParser: true});

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}); 
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.json());
    app.use(cors({origin:true}));

// Event Schema
 const eventSchema={
    slug:String,
    name:String,
    description:String,
    poster:String,
    startDate:Date,
    endDate:Date,
    published:Boolean,
 }
 const Event = mongoose.model("Event",eventSchema);

 // User Schema
const userSchema ={
    mobileNumber:String,
    email:String,
    password:String,
    fullName:String,
    role:String
}
const User = mongoose.model("User", userSchema)

// Ticket Schema
const ticketSchema = {
    eventId:String,
    date:Date,
    description:String,
    price:Number,
    totalQuantity:Number,
    availableQuantity:Number
}
const Ticket = mongoose.model("Ticket", ticketSchema)

// Order Schema
const orderSchema = {
   owner:String,
   eventId:String,
   ticketId:String,
   purchaseDate:Date,
   totalPrice:Number,
   quantity:Number,
   status:String
}
const Order = mongoose.model("Order", orderSchema)

/////////////////////////////////////////////
///////////////// ADMIN /////////////////////
/////////////////////////////////////////////
// Create Account


// Login
app.post("/login", (req, res) => {
    const password = req.body.password;
    const email = req.body.email;

    const user={
        email:email,
        password:password
    }
    User.find({ email: email}, (err, foundItems) => {
        if (err) {
            console.log(err);
            res.send("error");
        }
        if (foundItems.length) {
            if (foundItems[0].password === password) {
                if(foundItems[0].role === "admin_user"){
                    const token = jwt.sign({user}, "my_secret_key");
                    res.send({
                        token:token,
                        data:"Successfully Logged in as Admin"
                    })

                }else{
                    const token = jwt.sign({user}, "my_secret_key");
                    res.send({
                        token:token,
                        data:"Successfully Logged in as User"
                    })
                }
            }
        }
        else {
            res.send("You need to register");
        }
    });
});

app.get("/",(req,res)=>{
     res.send("Backend is running");
    })
  


function ensureToken(req,res,next){
   const bearerHeader = req.headers["authorization"];
   if(typeof bearerHeader!=="undefined"){
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token=bearerToken;
    next();
   }else{
    res.sendStatus(403);
   }
}

// Get Events
app.get("/events",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.sendStatus(403)
        }else{
            Event.find({},(err,foundItems)=>{
                if(err){
                  res.send("error");
                }
                if(foundItems.length){
                  res.send(foundItems)
                }
             })
        }
    })
   
})

//Post Event
app.post("/postEvent",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
       if(err){
        res.send("error");
        console.log(err)
       }else{
        const newEvent = new Event({
            slug:req.body.slug,
            name:req.body.name,
            description:req.body.description,
            poster:req.body.poster,
            startDate:req.body.startDate,
            endDate:req.body.endDate,
            published:req.body.published
      })
      newEvent.save(function(err){
            if(err){
              console.log(err);
              res.send("error");
            }
            else{
              res.send("Successfully saved");
            }
           });
       }
    })
})

//Update Event
app.post("/updateEvent",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            const eventId = req.body.eventId;
            Event.findByIdAndUpdate(eventId,{
                slug:req.body.slug,
                name:req.body.name,
                description:req.body.description,
                poster:req.body.poster,
                startDate:req.body.startDate,
                endDate:req.body.endDate,
                published:req.body.published
            },function(err){
                      if(err){
                        console.log(err);
                        res.send("error")
                      }else{
                        res.send("Successfully updated the event");
                      }
                    })
        }
    })
})

//Delete Event
app.post("/deleteEvent",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error")
        }else{
            Event.findOneAndDelete({name:req.body.name},function(err){
                    if(err){
                      console.log(err);
                      res.send("error")
                    }else{
                      res.send("Successfully deleted");
                    }
                  })
        }
    })
})

// Publish Unpublish Event
app.post("/changePublish",ensureToken, (req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            const eventId = req.body.eventId;
            const published = req.body.published;
            Event.findOneAndUpdate({_id:eventId},{published:published}, function(err){
                if(err){
                    console.log(err);
                    res.send("error");
                }
                else{
                    res.send("Successfully Updated")
                }
            })
        }
    }) 
})

// Get list of Reservations for an Event
app.get("/getListOfReservations",ensureToken, (req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
         if(err){
            res.statusCode(403)
         }else{
            const eventId = req.body.eventId;
            Order.find({eventId:eventId}, (err, foundItems)=>{
                if(err){
                    console.log(err);
                }
                if(foundItems.length){
                    res.send(foundItems);
                }
            })
         }
    })
})


// Create Ticket(Configure available tickets)
app.post("/createTicket",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error")
        }else{
            console.log(req.body.eventId)
            Ticket.find({eventId:req.body.eventId},(err,foundItems)=>{
                if(err){
                    console.log(err)
                }
                if(foundItems.length){
                    console.log(foundItems)

                    foundItems.forEach(foundItem=>{
                        console.log(foundItem.date.toString().slice(0,10))
                        console.log(req.body.date)
                        // if(foundItem.date.includes(req.body.date.toString().slice(0,10))){
                        //     res.send("Ticket exists")
                        //     console.log("Ticket")
                        // }
                    })
                    }
                    const newTicket = new Ticket({
                        eventId:req.body.eventId,
                        date:req.body.date.toString().slice(0,10),                  
                        description:req.body.description,
                        price:req.body.price,
                        totalQuantity:req.body.totalQuantity,
                        availableQuantity:req.body.availableQuantity
                  }) 
                  newTicket.save(function(err){
                        if(err){
                          console.log(err);
                          res.send("error");
                        }
                        else{
                          res.send("Successfully Created");
                        }
                       });        
                    
            })
        }
    })
})

app.get("/getEventDetailsWithid",ensureToken, (req,res)=>{
    const eventId = req.body.eventId;
    Event.find({eventId:eventId},(err, foundItems)=>{
        if(err){
            res.send("error");
        }
        if(foundItems.length){
            res.send(foundItems);
        }
    })
})
/////////////////////////////////////////////
///////////////// USER //////////////////////
/////////////////////////////////////////////
// Create Account
app.post("/register", (req, res) => {
    const fullName = req.body.fullName;
    const password = req.body.password;
    const mobileNumber = req.body.mobileNumber;
    const email = req.body.email;
    const role = req.body.role;

    const user={
        email:email,
        password:password
    }
 
    User.find({email:email},(err, foundItem)=>{
        if(foundItem.length){
            res.send("user already exists with this email")
        }else{
            User.find({mobileNumber:mobileNumber},(err,foundItem)=>{
                if(foundItem.length){
                    res.send("user already exists with this number")
                }else{
                    const newUser = new User({
                        mobileNumber:mobileNumber,
                        email:email,
                        password:password,
                        fullName:fullName,
                        role:role
                    })
                    newUser.save(function(err){
                        if(err){
                            console.log(err)
                        }
                        else{
                            // res.send(newUser)
                            const token = jwt.sign({user}, "my_secret_key");
                            res.send({
                                token:token,
                                data:"Successfully Saved"
                            })
                        }
                    })
                }
            })
        }
    })
});


// Login
app.post("/signIn",(req,res)=>{
    const mobileNo = req.body.mobileNo;
    const email = req.body.email;
    const password = req.body.password;
    if(email){
        User.find({email:email},(err,foundItem)=>{
            if(foundItem.length){
                if(password===foundItem[0].password){
                    res.send("sign in")
                }else{
                    res.send("wrong password")
                }
            }else{
                res.send("user does not exist")
            }
        })
    }else{
        User.find({mobileNumber:mobileNumber},(err,foundItem)=>{
            if(foundItem.length){
                if(password===foundItem[0].password){
                    res.send("sign in")
                }else{
                    res.send("wrong password")
                }
            }else{
                res.send("user does not exist")
            }
        })
    }
   })

// Get Events
app.get("/listEvents",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            Event.find({published:true},(err,foundItems)=>{
                if(err){
                  console.log(err);
                  res.send("error");
                }
                if(foundItems.length){
                  res.send(foundItems);
                }
             })
        }
    })
 })


// Get Available Quantity
app.get("/getAvailableTicketQuantity",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.statusCode(403);
        }else{
    const eventId = req.body.eventId;
    const date = req.body.date;
    Ticket.find({eventId:eventId},(err,foundItems)=>{
        if(err){
            console.log(err)
        }
        if(foundItems.length){
            foundItems.forEach(foundItem=>{
                if(foundItem.date===date){
                    res.send(foundItem)
                }
            })
            res.send("no")
        }
    })
        }
    })
    
})

// Get Event Details
app.get("/getEventDetails",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            const eventId = req.body.eventId;
            Event.find({_id:eventId},(err,foundItem)=>{
                if(err){
                    console.log(err);
                    res.send("error");
                }
                if(foundItem.length){
                    res.send(foundItem[0])
                }
            })
        }
    })
})

// Reserve Tickets
app.post("/orderTicket",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
// getting today date
const todayDate = new Date();
let day = todayDate.getDate();
let month = todayDate.getMonth() + 1;
let year = todayDate.getFullYear();
let currentDate = `${day}-${month}-${year}`;

 const ticketId = req.body.ticketId;
 const quantity = req.body.quantity;
 const eventId = req.body.eventId;
 const userId = req.body.userId;

  Ticket.find({_id:ticketId},(err,foundItem)=>{
   if(err){
       console.log(err);
       res.send("error");
       console.log(err);
   }
   if(foundItem.length){
    if(foundItem[0].availableQuantity<quantity){
        res.send(`error`)
    }else{
        var newQty = foundItem[0].availableQuantity - quantity
        Ticket.findByIdAndUpdate(ticketId,{availableQuantity:newQty}, function(err){
            if(err){
                res.send("error");
                console.log(err);
            }else{
                const TotalPrice = foundItem[0].price * quantity;
                const newOrder = new Order({
                    owner:userId,
                    eventId:eventId,
                    ticketId:ticketId,
                    purchaseDate:currentDate,
                    totalPrice:TotalPrice,
                    quantity:quantity,
                    status:"confirmed"
                }) 
                newOrder.save(function(err){
                    if(err){
                      console.log(err);
                      res.send("error");
                      console.log(err);
                    }
                    else{
                      res.send("Successfully Created Order");
                    }
                   });          
            }
        })
    }
   }
   else{
    res.send("error");
   }
  })
        }
    })
})

// Get Reserved Events
app.get("/getReservedEventsList",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            const userId = req.body.userId;
            Order.find({owner:userId},(err,foundItems)=>{
                if(err){
                    console.log(err);
                    res.send("error");
                }
                if(foundItems.length){
                    res.send(foundItems);
                }
            })
        }
    })
})

app.get("/getReservedEventsAdmin",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            const eventId = req.body.eventId;
            Order.find({eventId:eventId},(err,foundItems)=>{
                if(err){
                    console.log(err);
                    res.send("error");
                }
                if(foundItems.length){
                    res.send(foundItems);
                }
            })
        }
    })
})


app.get("/getReservedEvents",ensureToken,(req,res)=>{
    jwt.verify(req.token,"my_secret_key",function(err, data){
        if(err){
            res.send("error");
        }else{
            Order.find({},(err,foundItems)=>{
                if(err){
                    console.log(err);
                    res.send("error");
                }
                if(foundItems.length){
                    res.send(foundItems);
                }
            })
        }
    })
})


app.get("/getAllTickets", ensureToken, (req,res)=>{
    const eventId = req.body.eventId;

    Ticket.find({}, (err, foundItems)=>{
        if(err){
            console.log(err);
            res.send(err);
        }
        if(foundItems.length){
            console.log(foundItems);
            res.send(foundItems);
        }
    })
}) 

//   var PORT=5000;
//   app.listen(PORT, () => {
//     console.log(`nodeExample app listening at http://localhost:${PORT}`);
// });

module.exports.handler = serverless(app)

