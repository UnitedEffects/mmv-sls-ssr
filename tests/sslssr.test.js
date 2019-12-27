import "core-js/stable";
import "regenerator-runtime/runtime";
import lib from '../src/sslssr';

test('ensuring  uri with trigger is true', async () => {
    try {
        let test = await lib.checkTriggers(['/help/', '/card/', '/catalog/', '/about/'], '/catalog/something/123');
        expect(test).toBe(true);
        test = await lib.checkTriggers(['/help/', '/card/', '/catalog/', '/about/'], '/about/123');
        expect(test).toBe(true);
        test = await lib.checkTriggers(['/help/', '/card/', '/catalog/', '/about/'], '/help/topic');
        expect(test).toBe(true);
    } catch (error) {
        console.info(error);
        fail();
    }

});


test('ensuring  uri without trigger is false', async () => {
    try {
        let test = await lib.checkTriggers(['/help/', '/card/', '/catalog/'],'/about/');
        expect(test).toBe(false);
        test = await lib.checkTriggers(['/help/', '/card/', '/catalog/'],'/fake/');
        expect(test).toBe(false);
        test = await lib.checkTriggers(['/help/', '/card/', '/catalog/'],'/content/123');
        expect(test).toBe(false);
    } catch (error) {
        console.info(error);
        fail();
    }
});

test('ensure when there is no user agent but there is a trigger, we get a redirect', async () => {
    try {
        const result = await lib.userAgentFalse(true, 'https://domain.com/#/example');
        expect(result.status).toBe('302');
        expect(result.statusDescription).toBe('Found');
        expect(result.headers.location[0].value).toBe('https://domain.com/#/example')
    } catch(error) {
        console.info(error);
        fail();
    }
});

test('ensure when there is a user agent we get loaded content', async () => {
    try {
        const result = await lib.userAgentTrue("<html><body>test data</body></html>");
        expect(result.status).toBe('200');
        expect(result.statusDescription).toBe('OK');
        expect(result.headers['x-linkbot-found'][0].value).toBe('true');
        expect(result.body).toBe("<html><body>test data</body></html>");
    } catch(error) {
        console.info(error);
        fail();
    }
});

test('ensure chrome launches and returns results', async () => {
    try {
        const content = await lib.chromeSsr("https://google.com");
        const docType = content.includes("<!DOCTYPE html>");
        const html = content.includes("</html>");
        const meta = content.includes("<meta content=\"Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for.\" name=\"description\">");
        expect(docType).toBe(true);
        expect(html).toBe(true);
        expect(meta).toBe(true);
    } catch(error) {
        console.info(error);
        fail();
    }
});