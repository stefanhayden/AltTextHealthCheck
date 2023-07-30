
## Setup

Copy the `.env.example` to `.env` and update the values for your mastodon bot account.


cronttab entries
```
* * * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node readTimeline.js

1 * * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node clearDataFiles.js

0 * * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node post.js
```
