import "core-js/stable";
import "regenerator-runtime/runtime";
import sls from 'serverless-http';
import express from 'express';
import proxy from 'express-http-proxy';
import puppeteer from 'puppeteer-core';
import getChrome from './connect';
const app = express();

const PROXY_URL = process.env.PROXY_URL;
const TRIGGER_PATH = process.env.TRIGGER_PATH;

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
    const chrome = await getChrome();
    console.info(chrome);
    if (!chrome.didLaunch) throw 'Chrome did not launch';
    const browser = await puppeteer.connect({browserWSEndpoint: chrome.endpoint});
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle0'});
    const html = await page.content(); // serialized HTML of page DOM.
    await browser.close();
    return html;
}

async function middleCheck(req, res, next) {
    try {
        const ua = req.headers['user-agent'];
        let proxyUrl = PROXY_URL;
        let trigger = false;
        if (req.originalUrl.includes(TRIGGER_PATH)) {
            trigger = true;
            proxyUrl = `${PROXY_URL}/#${req.originalUrl}`;
        }
        if (ua === undefined || !userAgentPattern.test(ua) ||
            excludeUrlPattern.test(req.path)) {
            if (!trigger) return next();
            const redirect = `${req.protocol}://${req.get('host')}/#${req.originalUrl}`;
            return res.redirect(redirect);
        }
        return res.send(await chromeSsr(proxyUrl));
    } catch (error) {
        console.error(error);
        if (req.originalUrl.includes(TRIGGER_PATH)) {
            const redirect = `${req.protocol}://${req.get('host')}/#${req.originalUrl}`;
            return res.redirect(redirect);
        }
        return next();
    }
}

app.use([middleCheck], proxy(PROXY_URL));
app.set('port', 8080);

module.exports.handler = sls(app);