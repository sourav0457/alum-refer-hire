// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
// require('dotenv').config();
const accountSid = 'AC94828864498b96cd52edfe8bf7a85ad1';
const authToken = 'e1b24ae5f3100724e4f3d7fa7b2ea754';
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
     body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
     from: '+17312567111',
     to: '+17165637179'
   })
  .then(message => console.log(message.sid));
