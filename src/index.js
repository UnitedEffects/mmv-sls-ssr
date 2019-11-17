'use strict';

import "core-js/stable";
import "regenerator-runtime/runtime";
import chrome from 'chrome-aws-lambda';

const HOST_URL = 'https://mailmyvoice.com';
const TRIGGER = '/catalog/';

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

async function chromeSsr(url) {
    console.info('attempting to launch Chrome');
    let browser = null;
    browser = await chrome.puppeteer.launch({
        args: chrome.args,
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });
    console.info('Launched and connected to chrome');
    const page = await browser.newPage();
    try {
        await page.goto(url, {timeout: 27000, waitUntil: 'networkidle2'});
        const html = await page.content();
        await browser.close();
        console.info('have content');
        return html;
    } catch (error) {
        console.error(error);
        console.info('closing browser');
        if (browser !== null) await browser.close();
        throw error;
    }
}

module.exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    let hostUrl = HOST_URL;
    let trigger = false;
    let response;
    const ua = (request.headers['user-agent']) ? request.headers['user-agent'][0].value : undefined;
    console.info(`User Agent: ${ua}`);
    if (request.uri.includes(TRIGGER)) {
        trigger = true;
        hostUrl = `${hostUrl}/#${request.uri}`;
    }
    if (ua === undefined || !userAgentPattern.test(ua) ||
        excludeUrlPattern.test(request.uri)) {
        if (trigger) {
            response = {
                status: '302',
                statusDescription: 'Found',
                headers: {
                    location: [{
                        key: 'Location',
                        value: hostUrl,
                    }],
                },
            };
            return callback(null, response);
        }
        return callback(null, request);
    }
    try {
        const content = await chromeSsr(hostUrl);
        response = {
            status: '200',
            statusDescription: 'OK',
            headers: {
                'cache-control': [{
                    key: 'Cache-Control',
                    value: 'max-age=100'
                }],
                'content-type': [{
                    key: 'Content-Type',
                    value: 'text/html'
                }],
                'content-encoding': [{
                    key: 'Content-Encoding',
                    value: 'UTF-8'
                }],
                'x-linkbot-found': [{
                    key: 'x-linkbot-found',
                    value: 'true'
                }]
            },
            body: content,
        };
        console.info('responding with content');
        return callback(null, response);
    } catch (error) {
        console.info('Recording unexpected error rendering headless chrome');
        console.error(error);
        console.info('Attempting fallback response');
        if(trigger) request.uri = '/';
        console.info(request);
        return callback(null, request);
    }
};