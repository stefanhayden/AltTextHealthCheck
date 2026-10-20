const fs = require('node:fs')
const { run } = require('./lib');

const headers = {
	Authorization: process.env.INSTANCES_SOCIAL_AUTH
}

async function getPage({ count = 1000, sort_by = "active_users", sort_order = 'desc' } = {}) {
	const props = [
		`count=${count}`,
		`sort_by=${sort_by}`,
		`sort_order=${sort_order}`
	];
	const resp = await fetch(`https://instances.social/api/1.0/instances/list?${props.join('&')}`, { headers })
	if (!resp.ok) {
		throw new Error(`instances.social request failed: ${resp.status} ${await resp.text()}`);
	}
	return resp.json();
}

async function getTopServers() {
	const page = await getPage();
	if (!Array.isArray(page.instances) || !page.instances.length) {
		throw new Error(`unexpected instances.social response: ${JSON.stringify(page).slice(0, 500)}`);
	}
	fs.writeFileSync('topServers.txt', JSON.stringify(page.instances.map(s => s.name)))
}

if (require.main === module) {
	run(getTopServers);
}

module.exports = { getTopServers };
