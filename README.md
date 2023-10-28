
## Setup

Copy the `.env.example` to `.env` and update the values for your mastodon bot account.



cronttab entries
```
* * * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node readTimeline.js

1 12,23 * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node clearDataFiles.js

0 12,23 * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node post.js

15 12,23 * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node postLeaderboard.js

15 1 1,15 * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node getTopServers.js
```
