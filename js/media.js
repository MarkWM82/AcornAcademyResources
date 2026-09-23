async function loadJson(path) {
	const response = await fetch(path, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Could not load ${path}`);
	}
	return response.json();
}

function getItemSlug() {
	const params = new URLSearchParams(window.location.search);
	return params.get('item') || '';
}

function renderBreadcrumbs(pathParts) {
	const breadcrumbs = document.getElementById('breadcrumbs');
	if (!Array.isArray(pathParts) || pathParts.length === 0) {
		breadcrumbs.textContent = '';
		return;
	}
	breadcrumbs.textContent = pathParts.join(' > ');
}

function renderVideo(item) {
	const video = document.createElement('video');
	video.className = 'media-player';
	video.controls = true;
	video.preload = 'metadata';
	video.playsInline = true;
	if (item.poster) {
		video.poster = item.poster;
	}

	const source = document.createElement('source');
	source.src = item.file;
	source.type = item.mime || 'video/mp4';
	video.appendChild(source);

	video.append('Your browser does not support the video tag.');
	return video;
}

function renderMediaCollection(collection, allItems) {
	const wrapper = document.createElement('div');
	wrapper.className = 'stack';

	for (const slug of collection.items || []) {
		const item = allItems.find((entry) => entry.slug === slug);
		const section = document.createElement('section');
		section.className = 'card';

		if (!item) {
			const notice = document.createElement('p');
			notice.className = 'notice';
			notice.textContent = `The lesson "${slug}" could not be found.`;
			section.appendChild(notice);
		} else {
			const heading = document.createElement('h3');
			heading.textContent = item.title || 'Lesson resource';
			section.appendChild(heading);

			if (item.description) {
				const description = document.createElement('p');
				description.className = 'muted';
				description.textContent = item.description;
				section.appendChild(description);
			}

			section.appendChild(item.type === 'image' || item.type === 'gif' ? renderImage(item) : renderVideo(item));
		}

		wrapper.appendChild(section);
	}

	return wrapper;
}

function renderImage(item) {
	const image = document.createElement('img');
	image.className = 'media-image';
	image.src = item.file;
	image.alt = item.title || 'GIF';
	return image;
}

function renderMissing(message) {
	const container = document.getElementById('media-container');
	container.innerHTML = `<p class="notice">${message}</p>`;
	document.getElementById('media-title').textContent = 'Media not found';
	document.title = 'Media not found';
}

async function init() {
	const slug = getItemSlug();
	if (!slug) {
		renderMissing('No media item was specified in the link.');
		return;
	}

	try {
		const data = await loadJson('data/media.json');
		const item = (data.items || []).find((entry) => entry.slug === slug);
		if (!item) {
			renderMissing(`No media item matched "${slug}".`);
			return;
		}

		document.getElementById('page-title').textContent = item.title || 'Lesson Media';
		document.getElementById('media-title').textContent = item.title || 'Lesson Media';
		document.getElementById('media-description').textContent = item.description || '';
		document.title = item.title || 'Lesson Media';
		renderBreadcrumbs(item.path || []);

		const container = document.getElementById('media-container');
		container.innerHTML = '';

		if (item.type === 'collection') {
			container.appendChild(renderMediaCollection(item, data.items || []));
		} else if (item.type === 'gif' || item.type === 'image') {
			container.appendChild(renderImage(item));
		} else {
			container.appendChild(renderVideo(item));
		}
	} catch (error) {
		renderMissing(error.message);
	}
}

init();
