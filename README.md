# Mail My Voice Serverless SSR

A SSR solution using AWS Gateway, Lambda and Serverless

## Assumptions

I'm going to assume you have a cloudfront distribution ready to go. If you don't, go ahead and do that. There are a lot of instructions out there to accomplish this so I'm skipping it here. Just make sure that you don't configure an event trigger as part of your initial cloudfront setup. We'll do that after you deploy your function. I should note, that serverless now lets you do this setup all in one step; however, I honstely found it faster and easier to do this manually. Feel free to automate this though.

## Setup

Lambda Edge doesn't allow for environment variables, so you'll have to go into /src/index.js and update the following:

* line 8 - HOST_URL = your website that people are going to via browser
* line 9 - TRIGGER = a path to redirect to a #/ in the client or for rendering (because we need root paths for SSR and your spa may not have them)

Additionally, I've optimized this for our current SPA which doesn't use root paths. This means that all of our SPA routing is via domain/#/some-path. To account for this, I allow "domain/some-path" and then either redirect to the "domain/#/some-path" url if its not a bot, or use that to trigger my SSR if it is. From a user perspective, content always looks the same. In a future version, I'll make this configurable for newer SPA frameworks that allow root paths.

## Deploy

* yarn deploy

## CloudFront Trigger

* todo