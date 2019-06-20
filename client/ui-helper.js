const ui = {
	elementCommand: document.getElementById("command"),
	elementHistory: document.getElementById("history"),
	history: [],
	maxHistorySize: 10,
	command: '',
	updateCommandAndHistory(text) {
		if (this.command) this.updateHistory(this.command);
		this.elementCommand.innerHTML = text;
		this.command = text;
	},
	updateHistory(text) {
		this.history.unshift(text);
		if (this.history.length >= this.maxHistorySize) this.history.pop();
		this.elementHistory.innerHTML = '';
		this.history.forEach(text => {
			let li =  document.createElement('li');
			li.innerText = text;
			this.elementHistory.appendChild(li);
		});
	}
};
