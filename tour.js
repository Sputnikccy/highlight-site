const productTour = document.querySelector("#product-tour");

if (productTour && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
	productTour.dataset.narration = "ready";
	const narration = [
		{ start: 0, text: "Good conversations leave more than answers. They leave ideas worth finding again.", rate: .9, pitch: 1.02 },
		{ start: 4.2, text: "Select the words that matter. Highlight keeps them visible, without rewriting the page.", rate: .94, pitch: .98 },
		{ start: 9.2, text: "Add a note, so the reason you saved them comes back with the words.", rate: .92, pitch: 1.01 },
		{ start: 14.2, text: "Use tags to connect one idea with another, even across conversations.", rate: .95, pitch: .98 },
		{ start: 18.4, text: "Star the thoughts you want close.", rate: .88, pitch: 1.02 },
		{ start: 22.2, text: "Then sort the Library around the question you have today.", rate: .94, pitch: .98 },
		{ start: 26.2, text: "Open any card, and Highlight returns you to the original passage—not just the bottom of the chat.", rate: .92, pitch: 1 },
		{ start: 33.2, text: "Your Library stays local. Export or restore it whenever you choose.", rate: .91, pitch: .98 },
		{ start: 38.2, text: "Gather what matters. Keep it within reach.", rate: .86, pitch: 1.04 }
	];
	let timers = [];
	let cachedVoice = null;

	function localEnglishVoice() {
		const voices = speechSynthesis.getVoices();
		const preferredNames = ["Samantha", "Shelley (English (US))", "Flo (English (US))"];
		productTour.dataset.voiceCount = String(voices.length);
		cachedVoice = preferredNames.map(name => voices.find(voice => voice.name === name)).find(Boolean)
			|| voices.find(voice => voice.lang === "en-US" && voice.localService)
			|| voices.find(voice => voice.lang.startsWith("en") && voice.localService)
			|| voices.find(voice => voice.lang.startsWith("en"));
		if (cachedVoice) productTour.dataset.voice = cachedVoice.name;
		return cachedVoice;
	}

	function speak(segment, attempt = 0) {
		const voice = cachedVoice || localEnglishVoice();
		if (!voice && attempt < 5) {
			timers.push(setTimeout(() => {
				if (!productTour.paused && !productTour.ended) speak(segment, attempt + 1);
			}, 150));
			return;
		}
		speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(segment.text);
		utterance.lang = "en-US";
		utterance.rate = segment.rate;
		utterance.pitch = segment.pitch;
		utterance.volume = .92;
		if (voice) {
			utterance.voice = voice;
			productTour.dataset.voice = voice.name;
		}
		utterance.addEventListener("start", () => { productTour.dataset.narration = "speaking"; });
		utterance.addEventListener("end", () => {
			if (!productTour.paused && !productTour.ended) productTour.dataset.narration = "active";
		});
		speechSynthesis.speak(utterance);
	}

	function stopNarration() {
		for (const timer of timers) clearTimeout(timer);
		timers = [];
		speechSynthesis.cancel();
		productTour.dataset.narration = "idle";
	}

	function scheduleNarration() {
		stopNarration();
		productTour.dataset.narration = "active";
		const current = productTour.currentTime;
		const currentIndex = narration.findLastIndex(segment => segment.start <= current);
		if (currentIndex >= 0 && current < narration[currentIndex].start + 2.8) speak(narration[currentIndex]);
		for (const segment of narration) {
			if (segment.start <= current) continue;
			timers.push(setTimeout(() => {
				if (!productTour.paused && !productTour.ended) speak(segment);
			}, (segment.start - current) * 1000));
		}
	}

	productTour.addEventListener("play", scheduleNarration);
	productTour.addEventListener("pause", stopNarration);
	productTour.addEventListener("ended", stopNarration);
	productTour.addEventListener("seeking", () => {
		if (!productTour.paused) scheduleNarration();
	});
	localEnglishVoice();
	speechSynthesis.addEventListener("voiceschanged", localEnglishVoice);
}
