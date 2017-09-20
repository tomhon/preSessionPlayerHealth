var restify = require('restify');
var builder = require('botbuilder');
var config = require("./config");

var documentClient = require("documentdb").DocumentClient;
var config = require("./config");
var url = require('url');

var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;




// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Setup IOT Hub connection
var connectionString = 'HostName=iothubsoccercoach.azure-devices.net;DeviceId=mobile1;SharedAccessKey=nLSuFkJOj3dtkEgwJbjEpQe0i28ws7Z/lLWbb2d9dt8=' ;
// use factory function from AMQP-specific package
var clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
// AMQP-specific factory function returns Client object from core package
var iotClient = clientFromConnectionString(connectionString);
// use Message object from core package
var Message = require('azure-iot-device').Message;



//library to call Azure IOT Hub

function logToIOTHub (session) {

var connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err);
  } else {    console.log('Client connected');
    var userDataString = JSON.stringify(session.userData);
    var msg = new Message(userDataString);
    iotClient.sendEvent(msg, function (err) {
      if (err) {
        console.log('Error sending to IOT hub' + err.toString());
      } else {
        console.log('Message sent to IOT hub');
      };
    });
  };
};


iotClient.open(connectCallback);

}




/**
 * Get the database by ID, or create if it doesn't exist.
 * @param {string} database - The database to get or create
 */
function getDatabase() {
    console.log(`Getting database:\n${config.database.id}\n`);

    return new Promise((resolve, reject) => {
        client.readDatabase(databaseUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDatabase(config.database, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Get the collection by ID, or create if it doesn't exist.
 */
function getCollection() {
    console.log(`Getting collection:\n${config.collection.id}\n`);

    return new Promise((resolve, reject) => {
        client.readCollection(collectionUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Get the document by ID, or create if it doesn't exist.
 * @param {function} callback - The callback function on completion
 */
function getDBDocument(document) {
    let documentUrl = `${collectionUrl}/docs/${document.id}`;
    console.log(`Getting document:\n${document.id}\n`);

    return new Promise((resolve, reject) => {
        client.readDocument(documentUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDocument(collectionUrl, document, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
};

function pushLogData (document) {
    logDataArray.push(document);
    console.log('log pushed to array')
}

// List the questions to be asked
var questionsList = Array ();
questionsList[0] = 'What´s your energy level before the match? 5(Awesome) - 1(Horrible)';
questionsList[1] = 'How do you sleep before the match? 5(Awesome) - 1(Horrible)';
questionsList[2] = 'How good is the opponent? 5(Awesome) - 1(Horrible)';
questionsList[3] = 'What´s your primary focus for this match?';
questionsList[4] = 'What was your energy level during the match? 5(Awesome) - 1(Horrible)';
questionsList[5] = 'How much effort did you put in during the match? 5(My Absolute Best) - 1(None)';
questionsList[6] = 'How good was the opponent? 5(Awesome) - 1(Horrible)';
questionsList[7] = 'What was your primary achievement during the match?';
questionsList[8] = 'Did the team have fun during the match? 5(Awesome) - 1(Horrible)';
questionsList[9] = 'Who was the best player of the team? (Number 0-99)';

function logData () {
// function logData (session, question, response) {
    // id is the timestamp
    var date = new Date();
    this.id = date.toISOString(),
    this.user = 'Admin',
    this.question = 'Bot Initialized',
    this.response = 'Successfully'
};

var logDataArray = Array();


//additional inputHints not supported in botbuilder 3.4.4 - TODO put these back in 
// var numberPromptOptions = { speak: questionsList[0], inputHint: builder.InputHint.expectingInput,
//                 maxRetries: 3, minValue: 1, maxValue: 10, retryPrompt: 'Not a valid option'};

// var textPromptOptions = { speak: questionsList[0], inputHint: builder.InputHint.expectingInput,
//                 maxRetries: 3, retryPrompt: 'Not a valid option'};

var numberPromptOptions = { 
                maxRetries: 3, minValue: 1, maxValue: 5, retryPrompt: 'Not a valid option'};

var textPromptOptions = { 
                maxRetries: 3, retryPrompt: 'Not a valid option'};

function logResponse (session, question, response) {

        var date = new Date();
        session.userData.id = date.toISOString(),
        session.userData.user = session.message.user.name;
        session.userData.question = question.slice(0,question.indexOf('?')+1);
        session.userData.response = response;
        console.log('attempting write to docdb');
        logToIOTHub(session);
        getDBDocument(session.userData)
            .then(()  =>   console.log(oLogData))
            .catch((error) => { console.log(`LogResponse Completed with error ${JSON.stringify(error)}`) });


}

//dummy data
var playerName = 'Poppy Honeybone';
var playerNumber = 14;
var playerPosition = 'Center Mid';
var playerTeam = 'G04 Copa';
var playerClub = 'Seattle United FC'
var gameOrTraining = "Training";
var eventID = new Date().toLocaleDateString();
var eventTime = new Date().toLocaleDateString();
var preOrPost = "Pre";




// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID || '4c2d5e91-5090-4914-9435-575374491805',
    appPassword: process.env.MICROSOFT_APP_PASSWORD || 'gU2DhLRuJQOgFsK2swiasnR'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var savedAddress;

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')

var today = new Date().toLocaleDateString();

var bot = new builder.UniversalBot(connector, [
    //...Default dialog waterfall steps...
    function(session) {
        session.userData.playerName = playerName;
        session.userData.playerNumber = playerNumber;
        session.userData.playerPosition = playerPosition;
        session.userData.playerTeam = playerTeam;
        session.userData.playerClub = playerClub;
        session.userData.gameOrTraining = gameOrTraining;
        session.userData.eventID = eventID;
        session.userData.eventTime = eventTime;
        session.userData.preOrPost = preOrPost;


        session.beginDialog('survey');
    }
    ]);

function startProactiveDialog(addr) {
  // set resume:false to resume at the root dialog
  // else true to resume the previous dialog
  bot.beginDialog(addr, "*:/survey", {}, { resume: true });  
}


bot.dialog('addUser', [ 
    function(session, args) {
        builder.Prompts.confirm(session, 'Would you like your name added to the Player Health Survey list?');
        },

    function (session, results) {
        console.log('Response is ', results.response);
        if(results.response){
            savedAddress = session.message.address;
            console.log('Saved Address ', savedAddress);
            session.endDialog('Great - Thanks! I\'ve added you to the list and you\'ll receive your first survey in the next few days');
            }
        else 
            {
              session.endDialog('OK, bye!');
            }
    }
    ]);



bot.dialog('survey', [
    function (session, args, next) {
        session.userData.lastSurveyDate = true;
        savedAddress = session.message.address;
        if (session.userData.lastSurveyDate === false) {
        //check for user already completed today's survey
        // if (session.userData.lastSurveyDate === today) {
            session.endDialog('You\'ve already given feedback on today\'s session. Thanks!');
        } ;
        next();
    },
    function (session, results, next) {
        session.send('Hi '+ session.message.user.name + '! Please answer a few questions about ' + gameOrTraining + ' today.')
        logResponse(session, 'User Connected?', 'Successfully' );
        session.userData.lastSurveyDate = today;
        builder.Prompts.number( session, questionsList[0], numberPromptOptions );
        next();
        },
    function (session, results, next) {
        logResponse(session, questionsList[0], results.response);
        builder.Prompts.number( session, questionsList[1], numberPromptOptions );
        next();
    },
        function (session, results, next) {
        logResponse(session, questionsList[1], results.response);
        builder.Prompts.number( session, questionsList[2], numberPromptOptions );
        next();
    },
        function (session, results, next) {
        logResponse(session, questionsList[2], results.response);
        builder.Prompts.text( session, questionsList[3], textPromptOptions );
        next();
    },
        // function (session, results, next) {
        // logResponse(session, questionsList[3], results.response);
    //     builder.Prompts.number( session, questionsList[4], numberPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[4], results.response);
    //     builder.Prompts.number( session, questionsList[5], numberPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[5], results.response);
    //     builder.Prompts.number( session, questionsList[6], numberPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[6], results.response);
    //     builder.Prompts.text( session, questionsList[7], textPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[7], results.response);
    //     builder.Prompts.number( session, questionsList[8], numberPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[8], results.response);
    //     builder.Prompts.text( session, questionsList[9], textPromptOptions );
    //     next();
    // },
    //     function (session, results, next) {
    //     logResponse(session, questionsList[9], results.response);
    //     builder.Prompts.text( session, questionsList[10], textPromptOptions );
    //     next();
    // },

    function (session, results) {

        logResponse(session, questionsList[3], results.response);
        if (!results.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attempts :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        } else {
            session.endDialog('Thanks for all your answers. See you soon!');
        }




        // on error, start over

        session.on('error', function (err) {

            session.send('Failed with message: %s', err.message);

            session.endDialog();

        });



    }
]);

function sendProactiveMessage(addr) {
  var msg = new builder.Message().address(addr);
  msg.text('Hello, this is a notification');
  msg.textLocale('en-US');
  bot.send(msg);
}


// web interface
server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html',
}));
server.get('/api/CustomWebApi', (req, res, next) => {
    startProactiveDialog(savedAddress);
    // sendProactiveMessage(savedAddress);
    res.send('triggered');
    next();
  }
);

initialLogEntry = new logData();


//initialize database
getDatabase()
     .then(() => getCollection())
     .then(() => {getDBDocument(initialLogEntry)})
     .catch((error) => { exit(`Completed with error ${JSON.stringify(error)}`) });
