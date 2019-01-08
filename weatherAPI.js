var http = require('http')

// Connect to API URL api.openweathermap.org/data/2.5/weather?q={city name}
module.exports.city = function (city, callback) {

	// var options = {
	// 	host: "api.openweathermap.org",
	// 	path: "/data/2.5/weather?q=" + city + "&appid=" + process.env.WEATHER_API_ID + "&units=metric"
	// 	method: "GET"
	// }

	// var body = ""

	// var request = http.request(options, function(response) {

	// 	response.on('data', function(chunk) {
	// 		body += chunk.toString('utf8')
	// 	})
	// 	response.on('end', function() {

	// 		var json = JSON.parse(body)
	// 		if (json['cod'] == 502) {
	// 			callback("nac", "nac")
	// 			return
	// 		} 
	// 		var temperature = parseInt(json["main"]["temp"])
	// 		var description = json["weather"][0]["description"]
	// 		callback(temperature, description)
			
	// 	})
	// })
	// request.end()
	// 
	// 
	// 
	
	url = "api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + process.env.WEATHER_API_ID + "&units=metric";

	request(url, function (error, response, body) {

		var json = JSON.parse(body);


		callback(body)
    
  	});
}
