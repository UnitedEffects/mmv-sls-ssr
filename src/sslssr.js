import "regenerator-runtime/runtime";
import chrome from 'chrome-aws-lambda';

export default {
    async checkTriggers(triggers, uri) {
        let check = false;
        await Promise.all(triggers.map((t) => {
            if(uri.includes(t)) check = true;
        }));
        return check;
    },
    async chromeSsr(url) {
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
    },
    async userAgentFalse(bTrigger, hostUrl) {
        if (bTrigger) {
            return {
                status: '302',
                statusDescription: 'Found',
                headers: {
                    location: [{
                        key: 'Location',
                        value: hostUrl,
                    }],
                },
            };
        }
        return false;
    },
    async userAgentTrue(content)  {
        return {
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
    }
}