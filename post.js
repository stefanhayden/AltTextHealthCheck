const fs = require('node:fs');
const { postWithImage, readDomain, stackedBarChart, logShortUrl, pct, run } = require('./lib');

async function post() {

	const allDomains = fs.readFileSync('uniqueDomains.txt', { encoding: 'utf8' }).split('\n').filter(d => !!d);
	const uniqueDomains = Array.from(new Set(allDomains));

	const rawdata = fs.readFileSync('imageData.txt', { encoding: 'utf8' }).split('\n')
	const data = rawdata.filter(p => !!p).map(d => JSON.parse(d));

	const stats = data.reduce((acc, cur) => {
		acc.totalPosts += cur.totalPosts;
		acc.totalImages += cur.totalImages;
		acc.totalDescriptions += cur.totalDescriptions;
		acc.localPosts += cur.localPosts || 0;
		acc.localImages += cur.localImages || 0;
		acc.localDescriptions += cur.localDescriptions || 0;
		return acc;
	}, { totalPosts: 0, totalImages: 0, totalDescriptions: 0, localPosts: 0, localImages: 0, localDescriptions: 0 });

	console.log(stats);
	if (!stats.totalImages) {
		console.log('no images tracked, skipping post');
		return;
	}

	const displayPct = pct(stats.totalDescriptions, stats.totalImages);
	const displayLocalPct = pct(stats.localDescriptions, stats.localImages);

	const text = `
Tracked ${stats.totalPosts.toLocaleString()} posts across ${uniqueDomains.length.toLocaleString()} instances.

Federated: ${displayPct}% -  Found ${stats.totalDescriptions.toLocaleString()} descriptions set on ${stats.totalImages.toLocaleString()} images.

Local: ${displayLocalPct}% - Found ${stats.localDescriptions.toLocaleString()} descriptions set on ${stats.localImages.toLocaleString()} images.
	`;
	console.log(text)

	const qc = stackedBarChart({
		title: `Alt Text Health Check for ${readDomain()}`,
		labels: ['Federated', 'Local'],
		pcts: [displayPct, displayLocalPct],
		width: 800,
		height: 200,
	});
	await logShortUrl(qc);

	if (process.env.PROD) {
		await postWithImage({ status: text, image: await qc.toBinary(), description: text });
	}
}

run(post);
