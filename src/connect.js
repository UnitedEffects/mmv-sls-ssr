import * as launchChrome from "@serverless-chrome/lambda";
import * as request from "superagent";

const getChrome = async () => {
    const chrome = await launchChrome({
        flags: ['--ignore-certificate-errors', '--headless']
    });

    const response = await request
        .get(`${chrome.url}/json/version`)
        .set("Content-Type", "application/json");

    const endpoint = response.body.webSocketDebuggerUrl;

    return {
        endpoint,
        instance: chrome
    };
};

export default getChrome;