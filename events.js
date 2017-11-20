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
    var is_from_slash_command = (event == null || event == undefined || event.requestContext == null || event.requestContext == undefined);

    ical.fromURLAsync('https://www.atlantatechvillage.com/events.ics', {})
        .then((data) => {
            var flattened = [];

            Object.keys(data).forEach(key => {
                flattened.push(data[key]);
            });
            return flattened;
        })
        .filter((event) => {
            var duration = is_from_slash_command ? 'weeks' : 'days';

            return moment(event.start).diff(now, duration) <= 1;
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

            message.channel = process.env.SLACK_CHANNEL;
            slack.webhook(message, () => {});
        })
        .then((message) => {
            return {
                statusCode: 200,
                body: JSON.stringify(message)
            }
        })
        .then(callback);
};