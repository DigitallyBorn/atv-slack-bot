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
            return moment(event.start).diff(now, 'weeks') <= 1;
        })
        .map((event) => {
            return {
                title: event.summary,
                title_link: event.url,
                text: event.description,
                ts: moment(event.start).unix()
            };
        })
        .then((attachments) => {
            return {
                username: "ATV Events",
                attachments: attachments
            };
        })
        .tap((message) => {
            if (is_from_slash_command) {
                return;
            }

            if (message.attachments.length == 0) {
                return;
            }

            message.channel = process.env.SLACK_CHANNEL;
            slack.webhook(message, () => {});
        })
        .then((message) => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(message)
            });
        })
        .catch((err) => { 
            callback(err, null); 
        });
};