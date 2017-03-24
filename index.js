var rp = require('request-promise-native');
var moment = require('moment');
var Promise = require("bluebird");

var MAXTRIES_TRIP = process.env.WCLI_MAXTRIES_TRIP || 40;
var MAXTRIES_COMB = process.env.WCLI_MAXTRIES_COMB || 40;
var BASICURL = process.env.WCLI_API_ENDPOINT || 'https://www.wanderio.com';
var WAND_TOKEN = process.env.WCLI_TOKEN || '';
var WAND_USER = process.env.WCLI_USER || '';

var citiesId = ['5368ec0a67696f6cead93501',
    '5368ec0f67696f6cea443b01',
    '5368ec1867696f6ceaf54401',
    '5368ec1267696f6cea003f01',
    '5368ec0d67696f6ceade3901',
    '5368ec0667696f6ceabe3101',
    '5368ec0267696f6cea2c2d01',
    '5368ec1867696f6cea864501',
    '5368ec0567696f6cea9b3001',
    '5368ec1967696f6cea784601',
    '5368ec0667696f6cea623101'];

var getSearchBody = function() {
    var startingPoint = citiesId[Math.floor(Math.random() * citiesId.length)];
    var possibleEnds = citiesId.filter(function(el) { return el !== startingPoint; });
    var endingPoint = possibleEnds[Math.floor(Math.random() * possibleEnds.length)];

    console.log("START from", startingPoint, "to", endingPoint);
    return {
        "from": {
            "id": startingPoint,
            "kind": "city"
        },
        "adults": Math.floor(Math.random() * 4) + 1,
        "children": Math.floor(Math.random() * 2) + 1,
        "to": {
            "id": endingPoint,
            "kind": "city"
        },
        "departure_date": moment.utc().add(Math.floor(Math.random() * 10) + 1, 'day').format()
    };
};

var getSearchRequest = function() {
    var options = {
        method: 'POST',
        uri: BASICURL + '/v02/searches',
        headers: {
            "Content-Type": "application/json",
            "Wanderio-Locale": "it",
            "Wanderio-Token": WAND_TOKEN,
            "Wanderio-User": WAND_USER
        },
        body: {},
        json: true
    };

    options.body = getSearchBody();

    return options;
};

var getTripRequest = function(searchId) {
    var options = {
        method: 'GET',
        uri: BASICURL + '/v01/searches/' + searchId + '/trip',
        headers: {
            "Wanderio-Token": WAND_TOKEN,
            "Wanderio-User": WAND_USER
        },
        json: true
    };
    return options;
};

var _obtainTrips = function(searchId) {
    return rp(getTripRequest(searchId))
        .then(function(tripBody) {
            if (tripBody.hasOwnProperty("body")) {
                if (tripBody.body.hasOwnProperty("progress")) {
                    if (tripBody.body['progress'] !== 100)  {
                        return null;
                    } else {
                        return tripBody;
                    }
                }
            }

            return Promise.reject("trips");
        });
};

var obtainTrips = function(searchId, maxtries) {
    maxtries = maxtries || 0;

    if (maxtries >= MAXTRIES_TRIP) {
        return Promise.reject("trips.maxtri");
    }

    return _obtainTrips(searchId)
            .then(function(result) {
                if (result === null) {
                    return Promise.delay(Math.floor(Math.random() * 1000) + 1000)
                        .then(function() {
                            return obtainTrips(searchId, maxtries+1);
                        })
                } else {
                    return result;
                }
            })
            .catch(function (err) {
                return Promise.reject("trips");
            });
};

var getCombinationRequest = function(searchId, tripId) {
    var options = {
        method: 'GET',
        uri: BASICURL + '/v02/searches/' + searchId + '/trip/routes/'+ tripId +'/combinations/outbound?offset=0&limit=10',
        headers: {
            "Wanderio-Token": WAND_TOKEN,
            "Wanderio-User": WAND_USER
        },
        json: true
    };
    return options;
};

var _obtainCombinations = function(searchId, tripId) {
    return rp(getCombinationRequest(searchId, tripId))
        .then(function(combinationBody) {
            if (combinationBody.hasOwnProperty("body")) {
                if (combinationBody.body.hasOwnProperty("results")) {
                    if (combinationBody.body['results'].length === 0) {
                        return null;
                    } else {
                        return combinationBody;
                    }
                }
            }

            return Promise.reject("combination");
        });
};

var obtainCombinations = function(searchId, tripId, maxtries) {
    maxtries = maxtries || 0;

    if (maxtries >= MAXTRIES_COMB) {
        return Promise.reject("combination.maxtri");
    }

    return _obtainCombinations(searchId, tripId)
        .then(function(result) {
            if (result === null) {
                return Promise.delay(Math.floor(Math.random() * 1500) + 1000)
                    .then(function() {
                        return obtainCombinations(searchId, tripId, maxtries+1);
                    })
            } else {
                return result;
            }
        })
        .catch(function () {
            return Promise.reject("combination");
        });
};

var elapsed_time = function(){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000;
    return process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms";
};

var start = process.hrtime();
return rp(getSearchRequest())
    .then(function (searchBody) {
        if (searchBody.hasOwnProperty("body")) {
            if (searchBody.body.hasOwnProperty("id")) {
                return Promise.resolve(searchBody.body['id']);
            }
        }

        return Promise.reject("srequest");
    })
    .then(function(searchId) {
        return obtainTrips(searchId)
            .then(function(tripBody) {
                var routes = tripBody.body.generic_routes;

                return [searchId, routes[Math.floor(Math.random() * routes.length)].id];
            });
    })
    .then(function(searchAndTrip) {
        return obtainCombinations(searchAndTrip[0], searchAndTrip[1])
    })
    .then(function() {
        console.log("DONE", elapsed_time());
    })
    .catch(function (err) {
        console.log("FAIL", elapsed_time(), err);
    });