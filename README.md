# Mail My Voice Serverless SSR

An SSR solution using Lambda, CloudFront Edge, and Headless Chrome

## Assumptions

I'm going to assume you have a cloudfront distribution ready to go. If you don't, go ahead and do that. There are a lot of instructions out there to accomplish this so I'm skipping it here. Just make sure that you don't configure an event trigger as part of your initial CloudFront setup. We'll do that after you deploy your function. I should note, that serverless now lets you do this setup all in one step; however, I honestly found it faster and easier to do this manually. Feel free to automate this though.

* NOTE: You'll want to ensure you setup your CloudFront distribution to whitelist the User-Agent Headers. This will ensure that the useragent is passed to your origin request where your lambda function will see it. You'll also want to make sure you have selected "Use Origin Cache Headers". Doing these things will also mean that User-Agent is used as a unique key on the CDN cache. You can configure how long the cache lasts, default is 24 hours. If you are doing this manually as I did, make note of the CF distribution ID.

## Setup

Lambda Edge doesn't allow for environment variables, so you'll have to go into /src/index.js and update the following:

* line 6 - HOST_URL = your website that people are going to via browser
* line 7 - TRIGGERS = an array of paths to redirect to a #/ in the client or for rendering (because we need root paths for SSR and your spa may not have them)

Additionally, I've optimized this for our current SPA which doesn't use root paths. This means that all of our SPA routing is via domain/#/some-path. To account for this, I allow "domain/some-path" and then either redirect to the "domain/#/some-path" url if its not a bot, or use that to trigger my SSR if it is. From a user perspective, content always looks the same. In a future version, I'll make this configurable for newer SPA frameworks that allow root paths.

## Tests and Build

* yarn test
* yarn build

## Deploy

* There's nothing fancy going on here, so if you want your staging to be something specific (i.e. production or qa), manually update the serverless.yml file (lines 6 & 7)
* yarn deploy

## CloudFront Trigger

Assuming you've setup your CloudFront distribution as described above and your function is deployed, you'll now want to setup the CloudFront trigger to the function.
* Navigate to your lambda function in the AWS console
* At the top, click "Qualifiers" and "Versions" click the highest numerical version listed for your deployment. Do not click $Latest
* Click to add your trigger on the left of the lambda function
* Select CloudFront for your trigger
* Using the drop-down, choose your CloudFront distribution ID
* Select the acknowledgement checkbox
* No need to check the boxy to send the body since we are only interested in GET requests here
* Click to add the trigger

That should do it. Try out your function by going to your application in a browser. Keep in mind, it may take up to a day for your content to be available everywhere.
