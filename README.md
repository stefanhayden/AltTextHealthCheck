
## Setup

Requires Node 18 or newer (uses the built-in `fetch`).

Copy the `.env.example` to `.env` and update the values for your mastodon bot account. `READ_*` is the instance whose federated timeline is sampled; `WRITE_*` is the account the results are posted from. `topServers.txt` (used by the leaderboard) is fetched automatically on the first `postLeaderboard.js` run, or you can run `node getTopServers.js` yourself.



cronttab entries
```
* * * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node readTimeline.js

* * * * * sleep 30; cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node readTimeline.js

1 12,23 * * * cd /root/git/AltTextHealthCheck; /root/.nvm/versions/node/v19.5.0/bin/node clearDataFiles.js

0 12,23 * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node post.js

15 12,23 * * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node postLeaderboard.js

15 1 1,15 * * cd /root/git/AltTextHealthCheck; PROD=1 /root/.nvm/versions/node/v19.5.0/bin/node getTopServers.js
```
