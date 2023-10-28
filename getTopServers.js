require('dotenv').config()
const fs = require('node:fs')

const headers = {
	Authorization: process.env.INSTANCES_SOCIAL_AUTH 
}



async function getPage({ count = 10000, sort_by = "active_users", sort_order = 'desc',  min_id } = {}) {
	const props = [
		`count=${count}`,
		`sort_by=${sort_by}`,
		`sort_order=${sort_order}`
	];
	if (min_id) props.push(`min_id=${min_id}`)
	return await fetch(`https://instances.social/api/1.0/instances/list?${props.join('&')}`, { headers  })
	.then(data => {
		return data.json()
	})
}


async function getTopServers() {
	const page = await getPage({  });
	fs.writeFileSync('topServers.txt', JSON.stringify(page.instances.map(s => s.name)))
}

getTopServers();


