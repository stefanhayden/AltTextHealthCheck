require('dotenv').config()
const fs = require('node:fs');
const Mastodon = require('mastodon');

console.log(process.env)

function post() {

	const allDomains = fs.readFileSync('uniqueDomains.txt', { encoding: 'utf8' }).split('\n');
	const uniqueDomains = Array.from(new Set(allDomains));

	const rawdata = fs.readFileSync('imageData.txt', { encoding: 'utf8' }).split('\n')
	console.log(rawdata);
	const data = rawdata.filter(p => !!p).map(d => JSON.parse(d));

	const stats = data.reduce((acc, cur) => {
		acc.totalPosts += cur.totalPosts;
		acc.totalImages += cur.totalImages;
		acc.totalDescriptions += cur.totalDescriptions;
		return acc;
	}, { totalPosts: 0, totalImages: 0, totalDescriptions: 0  });

	console.log(stats);
	const altTextPct = (stats.totalDescriptions / stats.totalImages);

	const has = '▓';
	const hasNot = '░';
	const hasIcons = Math.round(18 * altTextPct)
	const hasNotIcons = Math.round(18 * (1 - altTextPct));
	
	const bar = `${new Array(hasIcons).fill(has).join('')}${new Array(hasNotIcons).fill(hasNot).join('')}`
	const displayPct = Math.round(altTextPct * 100)
	console.log({ altTextPct  });

	const text = `
Tracked ${stats.totalPosts} posts across ${uniqueDomains.length} instances over last hour.

Found ${stats.totalDescriptions} descriptions set on ${stats.totalImages} images.

${displayPct}% 
${bar}
	`;
	console.log(text)


	const m = new Mastodon({
		access_token: 'BBAfZthfg9_q1B-KpDSfl2cDk7xyzOKyipzpfBLkykM',
		timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
		api_url: 'https://mastodon.social/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
	});

	if (process.env.PROD)  {
		m.post('statuses', {  status: text})
	}
}

post();
