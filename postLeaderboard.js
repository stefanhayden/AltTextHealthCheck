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
		// Only a true zero reads as 0%; an instance with a little alt text shows <1% instead
		data[key].pctLabel = (data[key].pct === 0 && data[key].descriptions > 0) ? '<1%' : `${data[key].pct}%`;
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
	const show = 50;
	const topLeaders = leaders.filter((p) => topServers.includes(p.name));

	// Lowering the bar only adds instances, and 0% instances sort last, so the chart is free of them
	// once at least `show` instances with some alt text qualify. Use the highest bar (1.5x down to
	// 0.5x the average) where that holds; failing that, the highest that fills the chart; failing
	// that (very little data), the lowest bar, which shows the most instances
	const multipliers = [];
	for (let tenths = 15; tenths >= 5; tenths--) multipliers.push(tenths / 10);
	const qualifying = (m) => topLeaders.filter((p) => p.images > averageImages * m);
	const multiplier = multipliers.find((m) => qualifying(m).filter((p) => p.descriptions > 0).length >= show)
		?? multipliers.find((m) => qualifying(m).length >= show)
		?? multipliers[multipliers.length - 1];
	const shown = qualifying(multiplier).slice(0, show);
	console.log('multiplier', multiplier);
	console.log(shown);

	if (!shown.length) {
		console.log('no instances qualified, skipping post');
		return;
	}

	const text = `Results from tracking ${allImages.toLocaleString()} images across ${leaders.length.toLocaleString()} instances from the ${readDomain()} federated timeline.

Then filtering down to the top 1000 instances by active user from instances.social who had posted at least ${Math.floor(averageImages * multiplier) + 1} images (${multiplier.toFixed(1)}x the average).`;
	console.log(text)

	// Drop whole lines rather than cutting one off mid-name if the list is over the limit
	let altText = '';
	for (const p of shown) {
		const line = `${p.name} - ${p.pctLabel}`;
		if (altText.length + line.length + 1 > MAX_DESCRIPTION_LENGTH) break;
		altText += (altText ? '\n' : '') + line;
	}

	const qc = stackedBarChart({
		title: `Top ${shown.length} Alt Text Leaderboard`,
		labels: shown.map(p => `${p.name} ${p.pctLabel}`),
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
