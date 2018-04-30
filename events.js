'use strict';

const
    promise = require('bluebird'),
    Slack = promise.promisifyAll(require('slack-node')),
    moment = require('moment'),
    ical = promise.promisifyAll(require('ical'));

module.exports.daily_reminder = (event, context, callback) => {
    const slack = new Slack();
    slack.setWebhook(process.env['SLACK_WEBHOOK_URL']);

    var webhook_promise = (message) => {
        return new promise((resolve, reject) => {
            slack.webhook(message, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };

    const now = moment();
    const is_from_slash_command = !(event == null || event == undefined || event.requestContext == null || event.requestContext == undefined);

    ical.fromURLAsync('https://atlantatechvillage.com/events.ics', {})
        .then((data) => {
            var flattened = [];

            Object.keys(data).forEach(key => {
                flattened.push(data[key]);
            });
            return flattened;
        })
        .filter((event) => event.start !== undefined)
        .map((event) => {
            event.timestamp = moment(event.start)
            return event;
        })
        .filter((event) => {
            // If it's a slack command, send a full week
            // Otherwise, send only the next day
            if (is_from_slash_command) {
                return event.timestamp.diff(now, 'weeks') < 0;
            } else {
                return event.timestamp.diff(now, 'days') === 0;
            }
        })
        .map((event) => {
            // Construct the message attachments from events
            const attachment = {
                title: event.summary,
                title_link: event.url,
                text: event.description,
                ts: event.timestamp.unix()
            };

            const message = {
                username: "Village Events",
                attachments: [
                    attachment
                ],
                channel: process.env.SLACK_CHANNEL
            };

            return message;

            // if (!is_from_slash_command) {
            //     slack.webhook(message, () => { });
            // }

            // return attachment;
        })
        .map(webhook_promise)
        .then((message) => {
            // Return the Slack message as API results (for slash commands)
            callback(null, {
                statusCode: 200,
                body: message
            });
        })
        .catch((err) => {
            callback(err, null);
        });
};