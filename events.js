'use strict';

const Slack = require('slack-node');
const moment = require('moment');

const example_data = [{
    date: moment('2017-11-16 17:00:00'),
    name: 'Something cool happening at night',
    location: 'Speakeasy',
    description: 'This thing is going to be great. Check it out!',
    link: ''
}, {
    date: moment('2017-11-17 12:00:00'),
    name: 'SPEAKCHEESY FOOD TRUCK AT THE VILLAGE',
    location: 'Just outside',
    description: 'The Village’s own, Street Stop is bringing the Speakcheesy Food Truck back to the Village. Come by for $7 sandwiches and delicious…',
    link: 'http://atlantatechvillage.com/events/speakcheesy-food-truck-village-3'
}];

module.exports.daily_reminder = (event, context, callback) => {
    console.log(event);
    var slack = new Slack();
    slack.setWebhook(process.env['SLACK_WEBHOOK_URL']);

    var attachments = []

    example_data.forEach(function (element) {
        attachments.push({
            title: element.name,
            title_link: element.link,
            text: element.description,
            ts: element.date.unix()
        });
    }, this);

    var message = {
        username: "ATV Events",
        attachments: attachments
    };
    
    if (!event.requestContext) {
        message.channel = process.env.SLACK_CHANNEL;

        // Don't send this through the API if the lambda is invoked
        // via API Gateway
        slack.webhook(message, (err, response) => {
            if (err) {
                console.error(err);
            }
        });
    }

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(message)
    });
};