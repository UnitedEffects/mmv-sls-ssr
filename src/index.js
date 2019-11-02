'use strict';

import "core-js/stable";
import "regenerator-runtime/runtime";
import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

const HOST_URL = 'https://test.mailmyvoice.com';
const TRIGGER = '/catalog/';

const botUserAgents = [
    'Baiduspider',
    'bingbot',
    'Embedly',
    'facebookexternalhit',
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
    'Instagram'
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
    const browser = await puppeteer.launch({
        args: chrome.args,
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
    });
    console.info('Launched and connected to chrome');
    const page = await browser.newPage();
    await page.goto(url, {timeout: 10000, waitUntil: 'networkidle0'});
    const html = await page.content(); // serialized HTML of page DOM.
    await browser.close();
    return html;
}

module.exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    //console.info('REQUEST RECEIVED');
    //console.info(JSON.stringify(request, null, 2));
    let hostUrl = HOST_URL;
    let trigger = false;
    let response;
    const ua = (request.headers['user-agent']) ? request.headers['user-agent'][0].value : undefined;
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
            //console.info('REDIRECTING BASED ON TRIGGER');
            return callback(null, response);
        }
        //console.info('PASS THROUGH');
        return callback(null, request);
    }
    //console.info('NEED TO RENDER SSR');
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
    //console.info('SENDING SSR');
    return callback(null, response);
};