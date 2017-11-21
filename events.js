'use strict';

const
    promise = require('bluebird'),
    Slack = promise.promisifyAll(require('slack-node')),
    moment = require('moment'),
    ical = promise.promisifyAll(require('ical'));

module.exports.daily_reminder = (event, context, callback) => {
    var slack = new Slack();
    slack.setWebhook(process.env['SLACK_WEBHOOK_URL']);

    var now = moment();
    var is_from_slash_command = !(event == null || event == undefined || event.requestContext == null || event.requestContext == undefined);

    ical.fromURLAsync('https://atlantatechvillage.com/events.ics', {})
        .then((data) => {
            var flattened = [];

            Object.keys(data).forEach(key => {
                flattened.push(data[key]);
            });
            return flattened;
        })
        .filter((event) => {
            // If it's a slack command, send a full week
            // Otherwise, send only the next day
            var interval = is_from_slash_command ? 'weeks' : 'days';
            return moment(event.start).diff(now, interval) <= 1;
        })
        .map((event) => {
            // Construct the message attachments from events
            return {
                title: event.summary,
                title_link: event.url,
                text: event.description,
                ts: moment(event.start).unix()
            };
        })
        .then((attachments) => {
            // Build the message payload
            return {
                username: "ATV Events",
                attachments: attachments
            };
        })
        .tap((message) => {
            // This function is to handle function invocations that aren't through the API
            // It will reach out to the slack API to send the message
            if (is_from_slash_command) {
                return;
            }

            if (message.attachments.length == 0) {
                console.log('There are no events to announce. Skipping message send.');
                return;
            }

            message.channel = process.env.SLACK_CHANNEL;
            slack.webhook(message, () => {});
        })
        .then((message) => {
            // Return the Slack message as API results (for slash commands)
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(message)
            });
        })
        .catch((err) => { 
            callback(err, null); 
        });
};