require('dotenv').config()
const Mastodon = require('mastodon');
const fs = require('node:fs')

function read() {
	const m = new Mastodon({
		access_token: process.env.ACCESS_TOKEN,
		timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
		api_url: process.env.API_URL, // optional, defaults to https://mastodon.social/api/v1/
	});

	let extra = {};
	try {
		extra.since_id = fs.readFileSync('since_id.txt', { encoding: 'utf8'  })
	} catch (e) {} 


	m.get('timelines/public', { only_media: true, limit: 40,  ...extra }).then(resp => {
		const data = resp.data.filter(p => p.account.bot === false);

		const accountDomains = data.map(p => p.account.acct.split('@')[1]).filter(p => !!p)
		const uniqueDomains = Array.from(new Set(accountDomains));

		const totalPosts = data.length;
		const totalImages = data.map(p => p.media_attachments).flat().length;
		const totalDescriptions = data.map(p => p.media_attachments).flat().filter(p => p.description !== null).length;

		const localPostsData = data.filter(p => !p.account.acct.includes('@'))
		const localPosts = localPostsData.length;
		const localImages = localPostsData.map(p => p.media_attachments).flat().length;
		const localDescriptions = localPostsData.map(p => p.media_attachments).flat().filter(p => p.description !== null).length;

		fs.writeFileSync('since_id.txt', data[0].id)

		fs.appendFileSync('uniqueDomains.txt', uniqueDomains.join('\n'));

		const saveData = { totalPosts, totalImages, totalDescriptions, localPosts, localImages, localDescriptions }
		fs.appendFileSync('imageData.txt', JSON.stringify(saveData) + '\n')

	})

}

read();
