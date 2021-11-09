setTimeout(function () {
	window.location.replace('../html/.index.html');
}, 13000);

const MathEx = {
	degrees: function (radian) {
		return (radian / Math.PI) * 180;
	},
	radians: function (degree) {
		return (degree * Math.PI) / 180;
	},
	clamp: function (value, min, max) {
		return Math.min(Math.max(value, min), max);
	},
	mix: function (x1, x2, a) {
		return x1 * (1 - a) + x2 * a;
	},
	polar: function (radian1, radian2, radius) {
		return [
			Math.cos(radian1) * Math.cos(radian2) * radius,
			Math.sin(radian1) * radius,
			Math.cos(radian1) * Math.sin(radian2) * radius,
		];
	},
};

const debounce = (callback, duration) => {
	var timer;
	return function (event) {
		clearTimeout(timer);
		timer = setTimeout(function () {
			callback(event);
		}, duration);
	};
};

const computeFaceNormal = (v0, v1, v2) => {
	const n = [];
	const v1a = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
	const v2a = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
	n[0] = v1a[1] * v2a[2] - v1a[2] * v2a[1];
	n[1] = v1a[2] * v2a[0] - v1a[0] * v2a[2];
	n[2] = v1a[0] * v2a[1] - v1a[1] * v2a[0];
	const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2], 2);
	for (var i = 0; i < n.length; i++) {
		n[i] = n[i] / l;
	}
	return n;
};

class SkyOctahedron {
	constructor() {
		this.uniforms = {
			time: {
				type: 'f',
				value: 0,
			},
		};

		this.obj = this.createObj();
	}
	createObj() {
		const geometry = new THREE.OctahedronBufferGeometry(90, 4);
		const positions = geometry.attributes.position.array;
		const faceNormalsBase = [];
		const centersBase = [];
		const delaysBase = [];
		for (var i = 0; i < positions.length; i += 9) {
			const n = computeFaceNormal(
				[positions[i + 0], positions[i + 1], positions[i + 2]],
				[positions[i + 3], positions[i + 4], positions[i + 5]],
				[positions[i + 6], positions[i + 7], positions[i + 8]]
			);

			faceNormalsBase.push(
				n[0],
				n[1],
				n[2],
				n[0],
				n[1],
				n[2],
				n[0],
				n[1],
				n[2]
			);
			const c = [
				(positions[i + 0] + positions[i + 3] + positions[i + 6]) / 3,
				(positions[i + 1] + positions[i + 4] + positions[i + 7]) / 3,
				(positions[i + 2] + positions[i + 5] + positions[i + 8]) / 3,
			];

			const delay = Math.random() * 0.5;
			centersBase.push(c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2]);
			delaysBase.push(delay, delay, delay);
		}
		const faceNormals = new Float32Array(faceNormalsBase);
		const centers = new Float32Array(centersBase);
		const delays = new Float32Array(delaysBase);
		geometry.addAttribute(
			'faceNormal',
			new THREE.BufferAttribute(faceNormals, 3)
		);
		geometry.addAttribute('center', new THREE.BufferAttribute(centers, 3));
		geometry.addAttribute('delay', new THREE.BufferAttribute(delays, 1));
		return new THREE.Mesh(
			geometry,
			new THREE.RawShaderMaterial({
				uniforms: this.uniforms,
				vertexShader: document.getElementById('vs').textContent,
				fragmentShader: document.getElementById('fs').textContent,
				shading: THREE.FlatShading,
				transparent: true,
				side: THREE.DoubleSide,
			})
		);
	}
	render(time) {
		this.uniforms.time.value += time;
	}
}

class SkyOctahedronShell {
	constructor() {
		this.uniforms = {
			time: {
				type: 'f',
				value: 0,
			},
		};

		this.obj = this.createObj();
	}
	createObj() {
		const geometry = new THREE.OctahedronBufferGeometry(150, 4);
		return new THREE.Mesh(
			geometry,
			new THREE.RawShaderMaterial({
				uniforms: this.uniforms,
				vertexShader: document.getElementById('vs-shell').textContent,
				fragmentShader: document.getElementById('fs-shell').textContent,
				transparent: true,
				side: THREE.DoubleSide,
				depthWrite: false,
			})
		);
	}
	render(time) {
		this.uniforms.time.value += time;
	}
}

const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
	antialias: false,
	canvas: canvas,
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	1,
	10000
);
const clock = new THREE.Clock();

const skyOctahedron = new SkyOctahedron();
const skyOctahedronShell = new SkyOctahedronShell();

const resizeWindow = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
};
const render = () => {
	const time = clock.getDelta();
	skyOctahedron.render(time);
	skyOctahedronShell.render(time);
	renderer.render(scene, camera);
};
const renderLoop = () => {
	render();
	requestAnimationFrame(renderLoop);
};
const on = () => {
	window.addEventListener(
		'resize',
		debounce(() => {
			resizeWindow();
		}),
		1000
	);
};

const init = () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x070707, 1.0);
	camera.position.set(0, 400, 600);
	camera.lookAt(new THREE.Vector3());

	scene.add(skyOctahedron.obj);
	scene.add(skyOctahedronShell.obj);
	on();
	resizeWindow();
	renderLoop();
};
init();

// triangulation using https://github.com/ironwallaby/delaunay

const TWO_PI = Math.PI * 2;

var images = [],
	imageIndex = 0;

var image,
	imageWidth = 768,
	imageHeight = 485;

var vertices = [],
	indices = [],
	fragments = [];

var container = document.getElementById('container');

var clickPosition = [imageWidth * 0.5, imageHeight * 0.5];

window.onload = function () {
	TweenMax.set(container, { perspective: 500 });

	// images from reddit/r/wallpapers
	var urls = [
			'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/crayon.jpg',
			'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/spaceship.jpg',
			'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/dj.jpg',
			'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/chicken.jpg',
		],
		image,
		loaded = 0;
	// very quick and dirty hack to load and display the first image asap
	images[0] = image = new Image();
	image.onload = function () {
		if (++loaded === 1) {
			imagesLoaded();
			for (var i = 1; i < 4; i++) {
				images[i] = image = new Image();

				image.src = urls[i];
			}
		}
	};
	image.src = urls[0];
};

function imagesLoaded() {
	placeImage(false);
	triangulate();
	shatter();
}

function placeImage(transitionIn) {
	image = images[imageIndex];

	if (++imageIndex === images.length) imageIndex = 0;

	image.addEventListener('click', imageClickHandler);
	container.appendChild(image);

	if (transitionIn !== false) {
		TweenMax.fromTo(image, 0.75, { y: -1000 }, { y: 0, ease: Back.easeOut });
	}
}

function imageClickHandler(event) {
	var box = image.getBoundingClientRect(),
		top = box.top,
		left = box.left;

	clickPosition[0] = event.clientX - left;
	clickPosition[1] = event.clientY - top;

	triangulate();
	shatter();
}

function triangulate() {
	var rings = [
			{ r: 50, c: 12 },
			{ r: 150, c: 12 },
			{ r: 300, c: 12 },
			{ r: 1200, c: 12 }, // very large in case of corner clicks
		],
		x,
		y,
		centerX = clickPosition[0],
		centerY = clickPosition[1];

	vertices.push([centerX, centerY]);

	rings.forEach(function (ring) {
		var radius = ring.r,
			count = ring.c,
			variance = radius * 0.25;

		for (var i = 0; i < count; i++) {
			x =
				Math.cos((i / count) * TWO_PI) * radius +
				centerX +
				randomRange(-variance, variance);
			y =
				Math.sin((i / count) * TWO_PI) * radius +
				centerY +
				randomRange(-variance, variance);
			vertices.push([x, y]);
		}
	});

	vertices.forEach(function (v) {
		v[0] = clamp(v[0], 0, imageWidth);
		v[1] = clamp(v[1], 0, imageHeight);
	});

	indices = Delaunay.triangulate(vertices);
}

function shatter() {
	var p0, p1, p2, fragment;

	var tl0 = new TimelineMax({ onComplete: shatterCompleteHandler });

	for (var i = 0; i < indices.length; i += 3) {
		p0 = vertices[indices[i + 0]];
		p1 = vertices[indices[i + 1]];
		p2 = vertices[indices[i + 2]];

		fragment = new Fragment(p0, p1, p2);

		var dx = fragment.centroid[0] - clickPosition[0],
			dy = fragment.centroid[1] - clickPosition[1],
			d = Math.sqrt(dx * dx + dy * dy),
			rx = 30 * sign(dy),
			ry = 90 * -sign(dx),
			delay = d * 0.003 * randomRange(0.9, 1.1);
		fragment.canvas.style.zIndex = Math.floor(d).toString();

		var tl1 = new TimelineMax();

		tl1.to(fragment.canvas, 1, {
			z: -500,
			rotationX: rx,
			rotationY: ry,
			ease: Cubic.easeIn,
		});
		tl1.to(fragment.canvas, 0.4, { alpha: 0 }, 0.6);

		tl0.insert(tl1, delay);

		fragments.push(fragment);
		container.appendChild(fragment.canvas);
	}

	container.removeChild(image);
	image.removeEventListener('click', imageClickHandler);
}

function shatterCompleteHandler() {
	// add pooling?
	fragments.forEach(function (f) {
		container.removeChild(f.canvas);
	});
	fragments.length = 0;
	vertices.length = 0;
	indices.length = 0;

	placeImage();
}

//////////////
// MATH UTILS
//////////////

function randomRange(min, max) {
	return min + (max - min) * Math.random();
}

function clamp(x, min, max) {
	return x < min ? min : x > max ? max : x;
}

function sign(x) {
	return x < 0 ? -1 : 1;
}

//////////////
// FRAGMENT
//////////////

Fragment = function (v0, v1, v2) {
	this.v0 = v0;
	this.v1 = v1;
	this.v2 = v2;

	this.computeBoundingBox();
	this.computeCentroid();
	this.createCanvas();
	this.clip();
};
Fragment.prototype = {
	computeBoundingBox: function () {
		var xMin = Math.min(this.v0[0], this.v1[0], this.v2[0]),
			xMax = Math.max(this.v0[0], this.v1[0], this.v2[0]),
			yMin = Math.min(this.v0[1], this.v1[1], this.v2[1]),
			yMax = Math.max(this.v0[1], this.v1[1], this.v2[1]);

		this.box = {
			x: xMin,
			y: yMin,
			w: xMax - xMin,
			h: yMax - yMin,
		};
	},
	computeCentroid: function () {
		var x = (this.v0[0] + this.v1[0] + this.v2[0]) / 3,
			y = (this.v0[1] + this.v1[1] + this.v2[1]) / 3;

		this.centroid = [x, y];
	},
	createCanvas: function () {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.box.w;
		this.canvas.height = this.box.h;
		this.canvas.style.width = this.box.w + 'px';
		this.canvas.style.height = this.box.h + 'px';
		this.canvas.style.left = this.box.x + 'px';
		this.canvas.style.top = this.box.y + 'px';
		this.ctx = this.canvas.getContext('2d');
	},
	clip: function () {
		this.ctx.translate(-this.box.x, -this.box.y);
		this.ctx.beginPath();
		this.ctx.moveTo(this.v0[0], this.v0[1]);
		this.ctx.lineTo(this.v1[0], this.v1[1]);
		this.ctx.lineTo(this.v2[0], this.v2[1]);
		this.ctx.closePath();
		this.ctx.clip();
		this.ctx.drawImage(image, 0, 0);
	},
};
