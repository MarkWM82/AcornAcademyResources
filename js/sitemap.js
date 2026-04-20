async function loadJson(path) {
	const response = await fetch(path, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Could not load ${path}`);
	}
	return response.json();
}

function makeNodeLink(node) {
	const link = document.createElement('a');
	link.textContent = node.title;

	if (node.url) {
		link.href = node.url;
	} else if (node.item) {
		link.href = `media.html?item=${encodeURIComponent(node.item)}`;
	} else {
		link.href = '#';
	}

	return link;
}

function renderNode(node) {
	if (node.item) {
		const li = document.createElement('li');
		li.appendChild(makeMediaLink(node.item, node.title));
		return li;
	}

	const details = document.createElement('details');
	if (node.open) {
		details.open = true;
	}

	const summary = document.createElement('summary');
	summary.textContent = node.title;
	details.appendChild(summary);

	const list = document.createElement('ul');
	const children = Array.isArray(node.children) ? node.children : [];
	for (const child of children) {
		list.appendChild(renderNode(child));
	}
	details.appendChild(list);

	const wrapper = document.createElement('li');
	wrapper.appendChild(details);
	return wrapper;
}

function setAllDetails(open) {
	document.querySelectorAll('.tree-root details').forEach((details) => {
		details.open = open;
	});
}

async function init() {
	const root = document.getElementById('tree-root');
	const expandButton = document.getElementById('expand-all');
	const collapseButton = document.getElementById('collapse-all');

	expandButton.addEventListener('click', () => setAllDetails(true));
	collapseButton.addEventListener('click', () => setAllDetails(false));

	try {
		const data = await loadJson('data/sitemap.json');
		const list = document.createElement('ul');
		list.className = 'tree-list';

		for (const node of data.tree || []) {
			list.appendChild(renderNode(node));
		}

		root.innerHTML = '';
		root.appendChild(list);
	} catch (error) {
		root.innerHTML = `<p class="notice">${error.message}</p>`;
	}
}

init();
