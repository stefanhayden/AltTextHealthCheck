const fs = require('node:fs');
const { getTopServers } = require('./getTopServers');
const { MAX_DESCRIPTION_LENGTH, postWithImage, readDomain, stackedBarChart, logShortUrl, pct, run } = require('./lib');

const DATA_FILE = 'imageDataByDomains.txt';

// Remove only the bytes we read; readTimeline.js may have appended more while we were posting
function clearConsumed(bytesRead) {
	const current = fs.readFileSync(DATA_FILE);
	fs.writeFileSync(DATA_FILE, current.subarray(bytesRead));
}

async function post() {

	const rawBuffer = fs.readFileSync(DATA_FILE);
	const rawdata = rawBuffer.toString('utf8').split('\n')
	const rawdataParsed = rawdata.filter(p => !!p).map(d => {
		try {
			return JSON.parse(d)
		} catch(e) {
			return;
		}
	}).filter(p => !!p);

	const data = rawdataParsed.reduce((acc, val) => {
		const keys = Object.keys(val);
		keys.forEach((key) => {
			if (acc[key]) {
				acc[key].images += val[key].images;
				acc[key].descriptions += val[key].descriptions;
			} else {
				acc[key] = val[key]
			}
		})
		return acc;
	}, {})

	Object.keys(data).forEach((key) => {
		data[key].name = key;
		data[key].ratio = data[key].images ? data[key].descriptions / data[key].images : 0;
		data[key].pct = pct(data[key].descriptions, data[key].images);
	})

	// Sort on the exact ratio, then by volume, so ties are ordered consistently
	const leaders = Object.values(data).sort((a, b) => (b.ratio - a.ratio) || (b.images - a.images));

	// Fresh installs won't have the list until the twice-monthly cron runs
	if (!fs.existsSync('topServers.txt')) {
		await getTopServers();
	}
	const topServers = JSON.parse(fs.readFileSync('topServers.txt', { encoding: 'utf8' }))

	const allImages = leaders.map((p) => p.images).reduce((a, b) => a + b, 0)
	const averageImages = allImages / leaders.length

	console.log('leaders', leaders.length)
	console.log('averageImages', averageImages)
	console.log('allImages', allImages)
	const finalLeaders = leaders
		.filter((p) => topServers.includes(p.name))
		.filter((p) => p.images > (averageImages * 1.5))
	console.log(finalLeaders);

	if (!finalLeaders.length) {
		console.log('no instances qualified, skipping post');
		return;
	}

	const show = 50;
	const shown = finalLeaders.slice(0, show);

	const text = `Results from tracking ${allImages.toLocaleString()} images across ${leaders.length.toLocaleString()} instances from the ${readDomain()} federated timeline.

Then filtering down to the top 1000 instances by active user from instances.social who had posted at least ${Math.round(averageImages * 1.5)} images (1.5x the average).`;
	console.log(text)

	// Drop whole lines rather than cutting one off mid-name if the list is over the limit
	let altText = '';
	for (const p of shown) {
		const line = `${p.name} - ${p.pct}%`;
		if (altText.length + line.length + 1 > MAX_DESCRIPTION_LENGTH) break;
		altText += (altText ? '\n' : '') + line;
	}

	const qc = stackedBarChart({
		title: `Top ${show} Alt Text Leaderboard`,
		labels: shown.map(p => `${p.name} ${p.pct}%`),
		pcts: shown.map(p => p.pct),
		width: 600,
		height: 900,
	});
	await logShortUrl(qc);

	if (process.env.PROD) {
		await postWithImage({ status: text, image: await qc.toBinary(), description: altText });
		clearConsumed(rawBuffer.length);
	}
}

run(post);
