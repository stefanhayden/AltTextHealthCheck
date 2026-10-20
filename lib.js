require('dotenv').config()
const QuickChart = require('quickchart-js');

// Mastodon's default max length for media descriptions
const MAX_DESCRIPTION_LENGTH = 1500;

function instanceDomain(apiUrl) {
	return new URL(apiUrl).hostname;
}

function readDomain() {
	return instanceDomain(process.env.READ_API_URL);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Minimal Mastodon API client. `apiUrl` is any URL on the instance, e.g. https://mastodon.social/api/v1/
function mastodon(apiUrl, accessToken) {
	const origin = new URL(apiUrl).origin;

	async function request(method, path, body) {
		const resp = await fetch(`${origin}/api/${path}`, {
			method,
			headers: { Authorization: `Bearer ${accessToken}` },
			body,
			signal: AbortSignal.timeout(60 * 1000),
		});
		if (!resp.ok) {
			throw new Error(`${method} ${path} failed: ${resp.status} ${await resp.text()}`);
		}
		return { status: resp.status, data: await resp.json() };
	}

	return {
		get: (path, params = {}) => request('GET', `${path}?${new URLSearchParams(params)}`),
		post: (path, body) => request('POST', path, body),
	};
}

// Upload a PNG and post it as a status. Throws if any step fails.
async function postWithImage({ status, image, description }) {
	const m = mastodon(process.env.WRITE_API_URL, process.env.WRITE_ACCESS_TOKEN);

	const form = new FormData();
	form.append('file', new Blob([image], { type: 'image/png' }), 'chart.png');
	form.append('description', description.slice(0, MAX_DESCRIPTION_LENGTH));
	let { status: code, data: media } = await m.post('v2/media', form);

	// 202/206 mean the attachment is still processing and can't be attached to a status yet
	for (let attempt = 0; code === 202 || code === 206; attempt++) {
		if (attempt >= 30) {
			throw new Error(`media ${media.id} still processing`);
		}
		await sleep(1000);
		({ status: code, data: media } = await m.get(`v1/media/${media.id}`));
	}

	return m.post('v1/statuses', new URLSearchParams([['status', status], ['media_ids[]', media.id]]));
}

function stackedBarChart({ title, labels, pcts, width, height }) {
	const options = {
		type: 'horizontalBar',
		data: {
			labels,
			datasets: [
				{
					label: 'Has Alt text',
					backgroundColor: '#5e72e4',
					data: pcts,
					barPercentage: .9,
				},
				{
					label: 'No Alt Text',
					backgroundColor: 'rgba(0,0,0, .5)',
					data: pcts.map(p => 100 - p),
					barPercentage: .9,
				},
			],
		},
		options: {
			title: {
				display: true,
				text: title,
				fontStyle: 'bold',
				fontSize: 20,
				fontColor: '#fff',
			},
			legend: {
				labels: {
					fontSize: 13,
					fontStyle: 'bold',
					fontColor: '#fff',
				}
			},
			scales: {
				xAxes: [
					{
						gridLines: {
							display: false
						},
						stacked: true,
						ticks: {
							fontColor: '#fff',
						},
					},
				],
				yAxes: [
					{
						gridLines: {
							display: false
						},
						stacked: true,
						ticks: {
							fontColor: '#fff',
						},
					},
				],
			},
		},
	};
	const qc = new QuickChart();
	qc.setHeight(height).setWidth(width).setBackgroundColor('#111c44').setConfig(options);
	return qc;
}

// The short URL is only for eyeballing the chart in logs, so a failure here must not stop the post
async function logShortUrl(qc) {
	try {
		console.log(await qc.getShortUrl());
	} catch (e) {
		console.error('could not get chart short url', e);
	}
}

function pct(part, whole) {
	return whole ? Math.round((part / whole) * 100) : 0;
}

function run(main) {
	main().catch((e) => {
		console.error(e);
		process.exitCode = 1;
	});
}

module.exports = { MAX_DESCRIPTION_LENGTH, instanceDomain, readDomain, mastodon, postWithImage, stackedBarChart, logShortUrl, pct, run };
