const fs = require('node:fs')
const { mastodon, readDomain, run } = require('./lib');

async function read() {
	const m = mastodon(process.env.READ_API_URL, process.env.READ_ACCESS_TOKEN);
	const localDomain = readDomain();

	let extra = {};
	try {
		extra.since_id = fs.readFileSync('since_id.txt', { encoding: 'utf8' }).trim()
	} catch (e) {
		console.log('no since id')
	}

	const resp = await m.get('v1/timelines/public', { only_media: true, limit: 40, ...extra });
	console.log('public timeline', resp.data);

	if (!resp.data.length) {
		return;
	}

	// OG alt text posts
	const data = resp.data.filter(p => p.account.bot === false);
	const domainOf = p => p.account.acct.split('@')[1] || localDomain;
	const attachments = posts => posts.flatMap(p => p.media_attachments || []);
	const described = media => media.filter(p => p.description !== null);

	if (data.length) {
		const uniqueDomains = Array.from(new Set(data.map(domainOf)));

		const totalPosts = data.length;
		const totalImages = attachments(data).length;
		const totalDescriptions = described(attachments(data)).length;

		const localPostsData = data.filter(p => !p.account.acct.includes('@'))
		const localPosts = localPostsData.length;
		const localImages = attachments(localPostsData).length;
		const localDescriptions = described(attachments(localPostsData)).length;

		fs.appendFileSync('uniqueDomains.txt', uniqueDomains.join('\n') + '\n');

		const saveData = { totalPosts, totalImages, totalDescriptions, localPosts, localImages, localDescriptions }
		fs.appendFileSync('imageData.txt', JSON.stringify(saveData) + '\n')

		// New tracking by domain for leaderboards
		const domainMap = data.reduce((acc, val) => {
			const domain = domainOf(val);
			if (!acc[domain]) {
				acc[domain] = { images: 0, descriptions: 0 };
			}
			acc[domain].images += attachments([val]).length
			acc[domain].descriptions += described(attachments([val])).length

			return acc;
		}, {});
		fs.appendFileSync('imageDataByDomains.txt', JSON.stringify(domainMap) + '\n')
	}

	// Use the newest status overall, not the newest non-bot one, so nothing is fetched twice
	fs.writeFileSync('since_id.txt', resp.data[0].id)
}

run(read);
