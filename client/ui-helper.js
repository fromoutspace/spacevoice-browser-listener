const http = {
	get(theUrl) {
		const xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", theUrl, true);
		xmlHttp.send(null);
	},
	post(url, data, type) {
		const xmlHttp = new XMLHttpRequest();
		xmlHttp.open("POST", url, true);
		xmlHttp.setRequestHeader("Content-Type", type || "application/json");
		xmlHttp.send(JSON.stringify(data));
	}
};