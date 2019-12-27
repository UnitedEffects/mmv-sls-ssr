'use strict';

import "regenerator-runtime/runtime";
import lib from './sslssr';

const HOST_URL = 'https://mailmyvoice.com';
const TRIGGERS = ['/catalog/'];

const botUserAgents = [
    'Baiduspider',
    'bingbot',
    'Bingbot',
    'BingBot',
    'Embedly',
    'facebookexternalhit',
    'Facebot',
    'LinkedInBot',
    'outbrain',
    'pinterest',
    'quora link preview',
    'rogerbot',
    'showyoubot',
    'Slackbot',
    'TelegramBot',
    'Twitterbot',
    'vkShare',
    'W3C_Validator',
    'WhatsApp',
    'Applebot',
    'Googlebot',
    'GoogleBot',
    'googlebot',
    'ia_archiver',
    'HeadlessChrome'
];

const staticFileExtensions = [
    'ai', 'avi', 'css', 'dat', 'dmg', 'doc', 'doc', 'exe', 'flv',
    'gif', 'ico', 'iso', 'jpeg', 'jpg', 'js', 'less', 'm4a', 'm4v',
    'mov', 'mp3', 'mp4', 'mpeg', 'mpg', 'pdf', 'png', 'ppt', 'psd',
    'rar', 'rss', 'svg', 'swf', 'tif', 'torrent', 'ttf', 'txt', 'wav',
    'wmv', 'woff', 'xls', 'xml', 'zip',
];

const userAgentPattern = new RegExp(botUserAgents.join('|'), 'i');
const excludeUrlPattern = new RegExp(`\\.(${staticFileExtensions.join('|')})$`, 'i');

module.exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    let hostUrl = HOST_URL;
    let trigger = false;
    const ua = (request.headers['user-agent']) ? request.headers['user-agent'][0].value : undefined;
    console.info(`User Agent: ${ua}`);
    if (await lib.checkTriggers(TRIGGERS, request.uri))  {
        trigger = true;
        hostUrl = `${hostUrl}/#${request.uri}`;
    }
    if (ua === undefined || !userAgentPattern.test(ua) ||
        excludeUrlPattern.test(request.uri)) {
        return callback(null, await lib.userAgentFalse(trigger, hostUrl) || request);
    }
    try {
        const content = await lib.chromeSsr(hostUrl);
        console.info('responding with content');
        return callback(null, await lib.userAgentTrue(content));
    } catch (error) {
        console.info('Recording unexpected error rendering headless chrome');
        console.error(error);
        console.info('Attempting fallback response');
        if(trigger) request.uri = '/';
        console.info(request);
        return callback(null, request);
    }
};