var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var db = mongoose.connect(process.env.MONGODB_URI);


var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
    console.log('hello world 2019')
    res.send("Deployed! 2019 works! 2");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
    // Make sure this is a page subscription
    if (req.body.object == "page") {
        // Iterate over each entry
        // There may be multiple entries if batched
        req.body.entry.forEach(function(entry) {
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                console.log("test", event)
                if (event.postback) {
                    processPostback(event);
                } else if (event.message) {
                    processMessage(event);
                }
            });
        });

        res.sendStatus(200);
    }
});

function processPostback(event) {

}

function processMessage(event) {
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("Received message from senderId: " + senderId);
        console.log("Message is: " + JSON.stringify(message));

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise search for new movie.
            switch (formattedMsg) {
                case "hey":
                case "hi":
                case "hello":
                case "ni hao":
                    sendMessage(senderId, {text: "Heya! Welcome to RayBot" });
                    sendMessage(senderId, {
                        text: "How can I help you?", 
                        quick_replies: [{
                            "content_type":"text",
                            "title":"Find Weather Into",
                            "payload":"weather"
                          }, {
                            "content_type": "text",
                            "title": "Find Flight Info",
                            "payload": "flight"
                          }
                        ]
                      })
                    break;

                default:
                    findMovie(senderId, formattedMsg);
            }
        } else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don't understand your request. Please try again"});
        }
    }
}

function findMovie(userId, movieTitle) {
    request("http://www.omdbapi.com/?type=movie&t=" + movieTitle, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var movieObj = JSON.parse(body);
            if (movieObj.Response === "True") {
                var query = {user_id: userId};
                var update = {
                    user_id: userId,
                    title: movieObj.Title,
                    plot: movieObj.Plot,
                    date: movieObj.Released,
                    runtime: movieObj.Runtime,
                    director: movieObj.Director,
                    cast: movieObj.Actors,
                    rating: movieObj.imdbRating,
                    poster_url:movieObj.Poster
                };
                var options = {upsert: true};
                Movie.findOneAndUpdate(query, update, options, function(err, mov) {
                    if (err) {
                        console.log("Database error: " + err);
                    } else {
                        message = {
                            attachment: {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: [{
                                        title: movieObj.Title,
                                        subtitle: "Is this the movie you are looking for?",
                                        image_url: movieObj.Poster === "N/A" ? "http://placehold.it/350x150" : movieObj.Poster,
                                        buttons: [{
                                            type: "postback",
                                            title: "Yes",
                                            payload: "Correct"
                                        }, {
                                            type: "postback",
                                            title: "No",
                                            payload: "Incorrect"
                                        }]
                                    }]
                                }
                            }
                        };
                        sendMessage(userId, message);
                    }
                });
            } else {
                console.log(movieObj.Error);
                sendMessage(userId, {text: movieObj.Error});
            }
        } else {
            sendMessage(userId, {text: "Something went wrong. Try again. (findMovie); " + userId + ", " +  movieTitle });
        }
    });
}

function getMovieDetail(userId, field) {
    Movie.findOne({user_id: userId}, function(err, movie) {
        if(err) {
            sendMessage(userId, {text: "Something went wrong. Try again (movie details)"});
        } else {
            sendMessage(userId, {text: movie[field]});
        }
    });
}

// sends message to user
function sendMessage(recipientId, message) {

    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
}