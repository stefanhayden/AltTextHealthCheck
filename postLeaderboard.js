require('dotenv').config()
const fs = require('node:fs');
const Mastodon = require('mastodon');
const QuickChart = require('quickchart-js');


function clearFiles() {

	fs.writeFileSync('imageDataByDomains.txt', '');
}


async function post() {


	const rawdata = fs.readFileSync('imageDataByDomains.txt', { encoding: 'utf8' }).split('\n')
	const rawdataParsed = rawdata.filter(p => !!p).map(d => JSON.parse(d));

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
		data[key].pct = Math.round((data[key].descriptions / data[key].images) * 100) 
	})
	

	const leaders = Object.keys(data);
	leaders.sort((a, b) => {
		if (data[a].pct > data[b].pct) {
			return -1
		}
		if (data[a].pct < data[b].pct) {
			return 1
		}
		return 0
	});

	const topServers = JSON.parse(fs.readFileSync('topServers.txt', { encoding: 'utf8' }))

	const medianLeader = leaders[Math.round(leaders.length / 2)];
	const medianImages = data[medianLeader].images
	const allImages = Object.keys(data).map((key) => data[key].images).reduce((a, b) =>  a + b, 0)
	const averageImages = allImages /  leaders.length

	console.log('leaders', leaders.length)
	console.log('medianImages', medianImages)
	console.log('averageImages', averageImages)
	console.log('allImages', allImages)
	const finalLeaders = 
		leaders
		.map(l => { data[l].name = l;   return data[l]})
		.filter((p) => topServers.includes(p.name))
		.filter((p) => p.images > (averageImages * 2))
	console.log(finalLeaders);
	

	const show = 50;


	const text = `Results from tracking ${allImages.toLocaleString()} images across ${leaders.length.toLocaleString()} instances from the mastodon.social federated timeline. 

Then filtering down to the top 1000 instances by active user from instances.social who had posted at least ${Math.round(averageImages * 2)} images (2x the average).`;
	console.log(text)

	const altText = finalLeaders.slice(0, show).map(p => `${p.name} - ${p.pct}%`).join('\n');


	const options = {
		type: 'horizontalBar',
		data: {
			labels: finalLeaders.slice(0, show).map(p => `${p.name} ${p.pct}%`),
			datasets: [
				{
					label: 'Has Alt text',
					backgroundColor: '#5e72e4',
					data: finalLeaders.slice(0, show).map(p => p.pct), 
					barPercentage: .9,
				},
				{
					label: 'No Alt Text',
					backgroundColor: 'rgba(0,0,0, .5)',
					data: finalLeaders.slice(0, show).map(p => 100 - p.pct),
					barPercentage: .9,
				},
			],
		},
		options: {
			title: {
				display: true,
				text: `Alt Text Leaderboard`,
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
	qc.setHeight(900).setWidth(600).setBackgroundColor('#111c44').setConfig(options)
	
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
		Mv2.post('media', {  file: require('fs').createReadStream('tmp.png'), description: altText }).then(resp => {
			const id = resp.data.id;
			Mv1.post('statuses', {  status: text, media_ids: [id] })
		})
		clearFiles();
	}
}



post();



