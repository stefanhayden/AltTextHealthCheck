require('dotenv').config()
const fs = require('node:fs');
const Mastodon = require('mastodon');
const QuickChart = require('quickchart-js');

async function post() {

	const allDomains = fs.readFileSync('uniqueDomains.txt', { encoding: 'utf8' }).split('\n');
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
	}, { totalPosts: 0, totalImages: 0, totalDescriptions: 0, localPosts: 0, localImages: 0, localDescriptions: 0  });

	console.log(stats);
	const altTextPct = (stats.totalDescriptions / stats.totalImages);
	const altTextLocalPct = (stats.localDescriptions / stats.localImages);

	
	const displayPct = Math.round(altTextPct * 100);
	const displayLocalPct = Math.round(altTextLocalPct * 100);

	const text = `
Tracked ${stats.totalPosts} posts across ${uniqueDomains.length} instances.

Federated: ${displayPct}% -  Found ${stats.totalDescriptions} descriptions set on ${stats.totalImages} images.

Local: ${displayLocalPct}% - Found ${stats.localDescriptions} descriptions set on ${stats.localImages} images.
	`;
	console.log(text)

	const options = {
		type: 'horizontalBar',
		data: {
			labels: ['Federated', 'Local'],
			datasets: [
				{
					label: 'Has Alt text',
					backgroundColor: '#5e72e4',
					data: [displayPct, displayLocalPct],
					barPercentage: .9,
				},
				{
					label: 'No Alt Text',
					backgroundColor: 'rgba(0,0,0, .5)',
					data: [100 - displayPct, 100 - displayLocalPct],
					barPercentage: .9,
				},
			],
		},
		options: {
			title: {
				display: true,
				text: 'Alt Text Health Check',
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
	qc.setHeight(200).setWidth(800).setBackgroundColor('#111c44').setConfig(options)
	
	qc.getShortUrl().then((a) => console.log(a));


	const Mv1 = new Mastodon({
		access_token: process.env.ACCESS_TOKEN,
		timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
		api_url: process.env.API_URL, // optional, defaults to https://mastodon.social/api/v1/
	});
	const Mv2 = new Mastodon({
		access_token: process.env.ACCESS_TOKEN,
		timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
		api_url: process.env.API_URL, // optional, defaults to https://mastodon.social/api/v1/
	});

	await qc.toFile('./tmp.png');


	if (process.env.PROD)  {
		Mv2.post('media', {  file: require('fs').createReadStream('tmp.png'), description: text }).then(resp => {
			const id = resp.data.id;
			Mv1.post('statuses', {  status: text, media_ids: [id] })
		})
	}
}

post();
