const fs = require('node:fs');


function clearFiles() {

	fs.writeFileSync('imageData.txt', '');
	fs.writeFileSync('uniqueDomains.txt', '');
}

clearFiles();
