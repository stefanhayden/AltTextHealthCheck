
## Setup

Copy the `.env.example` to `.env` and update the values for your mastodon bot account. `LOCAL_TIMELINE` is `false` by default but set to `true` to only track posts on your instance.



cronttab entries
```
* * * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node readTimeline.js

1 8-23/12 * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node clearDataFiles.js

0 8-23/12 * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node post.js
```
