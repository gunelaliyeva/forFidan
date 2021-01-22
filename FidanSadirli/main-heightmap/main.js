let canvas;
let wgl;
let program;

let modelMatrix, viewMatrix, projectionMatrix;
let modelMatrixLocation, viewMatrixLocation, projectionMatrixLocation;
let ambientProductLocation, diffuseProductLocation, specularProductLocation;
let lightPosition0Location, lightPosition1Location, lightPosition2Location;
let vPosition, vTexCoord, vNormal;


//camera's coordinates and update

const up = vec3(0.0, 1.0, 0.0);
let cameraPhi = -1.8, cameraTheta = -0.8;
let cameraPosition = [5, 10, 5], directionOfCamera = [0, 0, 0], cameraTarget = [0, 0, 0];
let lightPosition0, lightPosition1, lightPosition2;
function updateCamera() {
	directionOfCamera = [Math.sin(cameraPhi) * Math.cos(cameraTheta), Math.sin(cameraTheta), Math.cos(cameraPhi) * Math.cos(cameraTheta)];
	cameraTarget = (add)(cameraPosition, directionOfCamera);
	viewMatrix = lookAt(cameraPosition, cameraTarget, up);
	lightPosition2 = cameraPosition;
}

//configuring texture

function configureTexture(image) {
	let texture = wgl.createTexture();
	wgl.activeTexture(wgl.TEXTURE0);
	wgl.bindTexture(wgl.TEXTURE_2D, texture);
	wgl.pixelStorei(wgl.UNPACK_FLIP_Y_WEBGL, true);
	wgl.texImage2D(wgl.TEXTURE_2D, 0, wgl.RGB, wgl.RGB, wgl.UNSIGNED_BYTE, image);
	wgl.generateMipmap(wgl.TEXTURE_2D);
	wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MIN_FILTER, wgl.NEAREST_MIPMAP_LINEAR);
	wgl.texParameteri(wgl.TEXTURE_2D, wgl.TEXTURE_MAG_FILTER, wgl.LINEAR);
	return texture;
}

//textures' material

function Material(material) {
	let self = this;
	self.ambient = material.ambient || [0.0, 0.0, 0.0, 1.0];
	self.diffuse = material.diffuse || [1.0, 1.0, 1.0, 1.0];
	self.textures = material.textures || [];
	self.bind = function () {
		self.textures.forEach((item, ind) => {
			wgl.activeTexture(wgl.TEXTURE0 + ind);
			wgl.bindTexture(wgl.TEXTURE_2D, item);
			wgl.uniform1i(wgl.getUniformLocation(program, "texture" + ind), ind);
		})
		wgl.uniform1i(wgl.getUniformLocation(program, "texturesCount"), self.textures.length);
		wgl.uniform4fv(ambientProductLocation, self.ambient);
		wgl.uniform4fv(diffuseProductLocation, self.diffuse);
	}
	return self;
}

//objects

function drawObject(object) {

	wgl.bindBuffer(wgl.ARRAY_BUFFER, object.vBuffer);
	wgl.vertexAttribPointer(vPosition, 4, wgl.FLOAT, false, 0, 0);

	wgl.bindBuffer(wgl.ARRAY_BUFFER, object.tBuffer);
	wgl.vertexAttribPointer(vTexCoord, 2, wgl.FLOAT, false, 0, 0);

	wgl.bindBuffer(wgl.ARRAY_BUFFER, object.nBuffer);
	wgl.vertexAttribPointer(vNormal, 3, wgl.FLOAT, false, 0, 0);

	wgl.enableVertexAttribArray(vNormal);

	if (object.position) object.modelMatrix = translate(object.position);

	wgl.uniformMatrix4fv(modelMatrixLocation, false, flatten(object.modelMatrix));

	object.material.bind();

	wgl.drawArrays(wgl.TRIANGLES, 0, object.vertexCount);
}

//generating terrain

function GenerateTerrain(sizeX, sizeY, heightMap, material) {
	let self = this;
	self.modelMatrix = mat4();
	self.material = material;
	self.sizeX = sizeX;
	self.sizeY = sizeY;
	let texRepeatsX = sizeX * 0.25;
	let texRepeatsY = sizeY * 0.25;
	let pointsArray = [], texCoordsArray = [], normalsArray = [];
	let h_scale = 0.4 / 256.0;
	let stepX = sizeX / (heightMap.width - 1);
	let stepY = sizeY / (heightMap.height - 1);
	let tex_stepX = texRepeatsX / (heightMap.width - 1);
	let tex_stepY = texRepeatsY / (heightMap.height - 1);

	for (let i = 0; i < heightMap.width - 1; i++) {
		for (let j = 0; j < heightMap.height - 1; j++) {
			pointsArray.push(vec4((i) * stepX - sizeX / 2, heightMap.rawData[(j) * heightMap.width + (i)] * h_scale, (j) * stepY - sizeY / 2, 1.0)); //"  |\        "
			pointsArray.push(vec4((i + 1) * stepX - sizeX / 2, heightMap.rawData[(j + 1) * heightMap.width + (i + 1)] * h_scale, (j + 1) * stepY - sizeY / 2, 1.0)); //"  | \       "
			pointsArray.push(vec4((i + 1) * stepX - sizeX / 2, heightMap.rawData[(j) * heightMap.width + (i + 1)] * h_scale, (j) * stepY - sizeY / 2, 1.0)); //"  |__\      "

			pointsArray.push(vec4((i) * stepX - sizeX / 2, heightMap.rawData[(j) * heightMap.width + (i)] * h_scale, (j) * stepY - sizeY / 2, 1.0));//"  \--|      "
			pointsArray.push(vec4((i) * stepX - sizeX / 2, heightMap.rawData[(j + 1) * heightMap.width + (i)] * h_scale, (j + 1) * stepY - sizeY / 2, 1.0));//"   \ |      "
			pointsArray.push(vec4((i + 1) * stepX - sizeX / 2, heightMap.rawData[(j + 1) * heightMap.width + (i + 1)] * h_scale, (j + 1) * stepY - sizeY / 2, 1.0));//"    \|      "

			texCoordsArray.push(vec2((i) * tex_stepX, (j) * tex_stepY));
			texCoordsArray.push(vec2((i + 1) * tex_stepX, (j + 1) * tex_stepY));
			texCoordsArray.push(vec2((i + 1) * tex_stepX, (j) * tex_stepY));

			texCoordsArray.push(vec2((i) * tex_stepX, (j) * tex_stepY));
			texCoordsArray.push(vec2((i) * tex_stepX, (j + 1) * tex_stepY));
			texCoordsArray.push(vec2((i + 1) * tex_stepX, (j + 1) * tex_stepY));
		}
	}
	self.vertexCount = pointsArray.length;
	for (let i = 0; i < pointsArray.length; i += 3) {
		let p0 = pointsArray[i];
		let p1 = pointsArray[i + 1];
		let p2 = pointsArray[i + 2];
		let A = subtract(p1, p0);
		let B = subtract(p2, p0);
		let N = normalize(cross(A, B));
		normalsArray.push(N);
		normalsArray.push(N);
		normalsArray.push(N);
	}

	self.vBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.vBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(pointsArray), wgl.STATIC_DRAW);

	self.tBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.tBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(texCoordsArray), wgl.STATIC_DRAW);

	self.nBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.nBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(normalsArray), wgl.STATIC_DRAW);

	self.draw = function () {
		drawObject(self);
	}
	//random points
	self.getRandomVertex = function () {
		return vec3(pointsArray[Math.round(Math.random() * pointsArray.length)]);
	}
	return self;
}
//generating Sphere

function GenerateSphere(size, material) {
	let self = this;
	self.size = size;
	self.material = material;
	self.modelMatrix = mat4();

	let pointsArray = [], normalsArray = [], texCoordsArray = [];
//calculating sphere
	let latitudeSteps = 10;
	let longitudeSteps = 20;

	let vertexPositionData = [], textureCoordData = [];

	for (let latNumber = 0; latNumber <= latitudeSteps; ++latNumber) {
		let theta = latNumber * Math.PI / latitudeSteps;
		let sinTheta = Math.sin(theta);
		let cosTheta = Math.cos(theta);

		for (let longNumber = 0; longNumber <= longitudeSteps; ++longNumber) {
			let phi = longNumber * 2 * Math.PI / longitudeSteps;
			let sinPhi = Math.sin(phi);
			let cosPhi = Math.cos(phi);

			let x = cosPhi * sinTheta;
			let y = cosTheta;
			let z = sinPhi * sinTheta;

			let u = 1 - (longNumber / longitudeSteps);
			let v = 1 - (latNumber / latitudeSteps);

			vertexPositionData.push(vec4(size * x, size * y, size * z, 1));
			textureCoordData.push([u, v]);
		}
	}

	for (let latNumber = 0; latNumber < latitudeSteps; ++latNumber) {
		for (let longNumber = 0; longNumber < longitudeSteps; ++longNumber) {

			let first = (latNumber * (longitudeSteps + 1)) + longNumber;
			let second = first + longitudeSteps + 1;

			pointsArray.push(vertexPositionData[first]);
			pointsArray.push(vertexPositionData[second]);
			pointsArray.push(vertexPositionData[first + 1]);

			pointsArray.push(vertexPositionData[second]);
			pointsArray.push(vertexPositionData[second + 1]);
			pointsArray.push(vertexPositionData[first + 1]);

			texCoordsArray.push(textureCoordData[first]);
			texCoordsArray.push(textureCoordData[second]);
			texCoordsArray.push(textureCoordData[first + 1]);

			texCoordsArray.push(textureCoordData[second]);
			texCoordsArray.push(textureCoordData[second + 1]);
			texCoordsArray.push(textureCoordData[first + 1]);
		}
	}

	pointsArray.forEach((item, index) => {
		normalsArray[index] = vec3(item)
	} )

	self.vertexCount = pointsArray.length;

	self.vBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.vBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(pointsArray), wgl.STATIC_DRAW);

	self.tBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.tBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(texCoordsArray), wgl.STATIC_DRAW);

	self.nBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.nBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(normalsArray), wgl.STATIC_DRAW);

	self.texturesCount = 0;

	self.draw = function () {
		drawObject(self);
	}
}

let textureCoordinate = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(1, 0)
];

//generating Cube

function GenerateCube(size, material) {
	let self = this;
	self.size = size;
	self.material = material;
	self.modelMatrix = mat4();

	let pointsArray = [], normalsArray = [], texCoordsArray = [];

	let vertices = [
		vec4(-1.0, -1.0, 1.0, 1.0),
		vec4(-1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, -1.0, 1.0, 1.0),
		vec4(-1.0, -1.0, -1.0, 1.0),
		vec4(-1.0, 1.0, -1.0, 1.0),
		vec4(1.0, 1.0, -1.0, 1.0),
		vec4(1.0, -1.0, -1.0, 1.0)
	];

	function quad(a, b, c, d) {
		pointsArray.push(vec4(vertices[a]));
		texCoordsArray.push(textureCoordinate[0]);

		pointsArray.push(vec4(vertices[b]));
		texCoordsArray.push(textureCoordinate[1]);

		pointsArray.push(vec4(vertices[c]));
		texCoordsArray.push(textureCoordinate[2]);

		pointsArray.push(vec4(vertices[a]));
		texCoordsArray.push(textureCoordinate[0]);

		pointsArray.push(vec4(vertices[c]));
		texCoordsArray.push(textureCoordinate[2]);

		pointsArray.push(vec4(vertices[d]));
		texCoordsArray.push(textureCoordinate[3]);
	}
//calculating cube
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);

	for (let i = 0; i < pointsArray.length; i += 3) {
		let p0 = pointsArray[i];
		let p1 = pointsArray[i + 1];
		let p2 = pointsArray[i + 2];
		let A = subtract(p1, p0);
		let B = subtract(p2, p0);
		let N = normalize(cross(A, B));
		normalsArray.push(N);
		normalsArray.push(N);
		normalsArray.push(N);
	}

	pointsArray.forEach(item => {
		item[0] *= self.size;
		item[1] *= self.size;
		item[2] *= self.size;
	})

	self.vertexCount = pointsArray.length;

	self.vBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.vBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(pointsArray), wgl.STATIC_DRAW);

	self.tBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.tBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(texCoordsArray), wgl.STATIC_DRAW);


	self.nBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.nBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(normalsArray), wgl.STATIC_DRAW);

	self.draw = function () {
		drawObject(self);
	}
}

//generating Pyramid

function GeneratePyramid(size, material) {
	let self = this;
	self.size = size;
	self.material = material;
	self.modelMatrix = mat4();

	let pointsArray = [], normalsArray = [], texCoordsArray = [];

	let vertices = [
		vec4(-1.0, -1.0, -1.0, 1.0),
		vec4(-1.0, -1.0, 1.0, 1.0),
		vec4(1.0, -1.0, 1.0, 1.0),
		vec4(1.0, -1.0, -1.0, 1.0),
		vec4(0.0, 1.0, 0.0, 1.0),
	];

	pointsArray.push(vec4(vertices[1]));
	texCoordsArray.push(textureCoordinate[0]);

	pointsArray.push(vec4(vertices[0]));
	texCoordsArray.push(textureCoordinate[1]);

	pointsArray.push(vec4(vertices[3]));
	texCoordsArray.push(textureCoordinate[2]);

	pointsArray.push(vec4(vertices[1]));
	texCoordsArray.push(textureCoordinate[0]);

	pointsArray.push(vec4(vertices[3]));
	texCoordsArray.push(textureCoordinate[2]);

	pointsArray.push(vec4(vertices[2]));
	texCoordsArray.push(textureCoordinate[3]);

	pointsArray.push(vec4(vertices[4]));
	texCoordsArray.push(textureCoordinate[2]);
	pointsArray.push(vec4(vertices[0]));
	texCoordsArray.push(textureCoordinate[1]);
	pointsArray.push(vec4(vertices[1]));
	texCoordsArray.push(textureCoordinate[0]);

	pointsArray.push(vec4(vertices[4]));
	texCoordsArray.push(textureCoordinate[3]);
	pointsArray.push(vec4(vertices[3]));
	texCoordsArray.push(textureCoordinate[2]);
	pointsArray.push(vec4(vertices[0]));
	texCoordsArray.push(textureCoordinate[1]);

	pointsArray.push(vec4(vertices[4]));
	texCoordsArray.push(textureCoordinate[3]);
	pointsArray.push(vec4(vertices[2]));
	texCoordsArray.push(textureCoordinate[0]);
	pointsArray.push(vec4(vertices[3]));
	texCoordsArray.push(textureCoordinate[2]);

	pointsArray.push(vec4(vertices[4]));
	texCoordsArray.push(textureCoordinate[1]);
	pointsArray.push(vec4(vertices[1]));
	texCoordsArray.push(textureCoordinate[0]);
	pointsArray.push(vec4(vertices[2]));
	texCoordsArray.push(textureCoordinate[3]);

//calculating pyramid

	for (let i = 0; i < pointsArray.length; i += 3) {
		let p0 = pointsArray[i];
		let p1 = pointsArray[i + 1];
		let p2 = pointsArray[i + 2];
		let A = subtract(p1, p0);
		let B = subtract(p2, p0);
		let N = normalize(cross(A, B));
		normalsArray.push(N);
		normalsArray.push(N);
		normalsArray.push(N);
	}
	pointsArray.forEach(item => {
		item[0] *= self.size;
		item[1] *= self.size;
		item[2] *= self.size;
	})

	self.vertexCount = pointsArray.length;
	self.vBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.vBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(pointsArray), wgl.STATIC_DRAW);

	self.tBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.tBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(texCoordsArray), wgl.STATIC_DRAW);

	self.nBuffer = wgl.createBuffer();
	wgl.bindBuffer(wgl.ARRAY_BUFFER, self.nBuffer);
	wgl.bufferData(wgl.ARRAY_BUFFER, flatten(normalsArray), wgl.STATIC_DRAW);

	self.draw = function () {
		drawObject(self);
	}
}

//creating all objects
let objects = [];
let materials = [];

window.onload = function init() {
	canvas = document.getElementById("canvas");

//moving mouse

	mouseMovement(canvas);

	wgl = WebGLUtils.setupWebGL(canvas);

	if (!wgl) {
		alert("WebGL isn't available");
	}

	wgl.viewport(0, 0, canvas.width, canvas.height);
	wgl.clearColor(0.5, 1.0, 0.5, 0.8);
	wgl.enable(wgl.DEPTH_TEST);

	program = initShaders(wgl, "vertex-shader", "fragment-shader");

	modelMatrixLocation = wgl.getUniformLocation(program, "modelMatrix");
	viewMatrixLocation = wgl.getUniformLocation(program, "viewMatrix");
	projectionMatrixLocation = wgl.getUniformLocation(program, "projectionMatrix");
	ambientProductLocation = wgl.getUniformLocation(program, "ambientProduct");
	diffuseProductLocation = wgl.getUniformLocation(program, "diffuseProduct");
	specularProductLocation = wgl.getUniformLocation(program, "specularProduct");
	lightPosition0Location = wgl.getUniformLocation(program, "lightPosition0"); //sun
	lightPosition1Location = wgl.getUniformLocation(program, "lightPosition1"); //star
	lightPosition2Location = wgl.getUniformLocation(program, "lightPosition2"); //light source binding to camera

	vPosition = wgl.getAttribLocation(program, "vPosition");
	vTexCoord = wgl.getAttribLocation(program, "vTexCoord");
	vNormal = wgl.getAttribLocation(program, "vNormal");
	wgl.enableVertexAttribArray(vPosition);
	wgl.enableVertexAttribArray(vTexCoord);
	wgl.enableVertexAttribArray(vNormal);

	wgl.useProgram(program);

	materials = createMaterials();

	let terrain = chooseTerrainFromHeightMap();

	objects.push(terrain);

//texture part
	let object = {
		sun: new GenerateSphere(0.80, materials["sun"]),
		earth: new GenerateSphere(0.40, materials["earth"]),
		venus: new GenerateSphere(0.50, materials["venus"]),
		stone: new GenerateCube(0.3, materials["stone"]),
		wood: new GenerateCube(0.3, materials["wood"]),
		desert: new GeneratePyramid(0.3, materials["desert"]),
		grass: new GeneratePyramid(0.3, materials["grass"]),
		star: new GenerateSphere(0.40, materials["star"])
	};


	for (let i in object) {
		let pos = terrain.getRandomVertex();
		pos[1] += object[i].size;
		object[i].position = pos;
		objects.push(object[i]);

		if (i === "sun") {
			lightPosition0 = object[i].position;
		}
		if (i === "star") {
			lightPosition1 = object[i].position;
		}
	}
	render();
}

let render = function () {
	wgl.clear(wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);
	projectionMatrix = perspective(60.0, 800 / 600, 1, 2000.0);
	wgl.uniformMatrix4fv(viewMatrixLocation, false, flatten(viewMatrix));
	wgl.uniformMatrix4fv(projectionMatrixLocation, false, flatten(projectionMatrix));
	wgl.uniform3fv(lightPosition0Location, lightPosition0);
	wgl.uniform3fv(lightPosition1Location, lightPosition1);
	wgl.uniform3fv(lightPosition2Location, lightPosition2);

	objects.forEach(item => item.draw());
	requestAnimFrame(render);
}


//keys to navigate
document.onkeydown = (ev) => {
	switch (ev.code) {
		case 'KeyI': { //zoom in
			cameraPosition = add(cameraPosition, directionOfCamera);
			updateCamera();
			break;
		}
		case 'KeyO': { // zoom out
			cameraPosition = subtract(cameraPosition, directionOfCamera);
			updateCamera();
			break;
		}
		case 'ArrowLeft': { // left
			cameraPosition = subtract(cameraPosition, [-directionOfCamera[2], 0, directionOfCamera[0]]);
			updateCamera();
			break;
		}
		case 'ArrowRight': { //right
			cameraPosition = add(cameraPosition, [-directionOfCamera[2], 0, directionOfCamera[0]]);
			updateCamera();
			break;
		}
		case 'ArrowUp': {  //forward
			cameraPosition  = add(cameraPosition, [directionOfCamera[0], 0, Math.cos(cameraPhi)]);
			updateCamera();
			break;
		}
		case 'ArrowDown': { //back
			cameraPosition = subtract(cameraPosition, [directionOfCamera[0], 0, Math.cos(cameraPhi)]);
			updateCamera();
			break;
		}
		case 'KeyU': { //up
			cameraPosition[1] += 1;
			updateCamera();
			break;
		}
		case 'KeyD': { //down
			cameraPosition[1] -= 1;
			updateCamera();
			break;
		}
		default: return;
	}
}

function mouseMovement(canvas) {
	let mouseX = 0, mouseY = 0, isMouseMove = false;
	canvas.addEventListener("mousedown", () => {
		isMouseMove = true;
	});

	canvas.addEventListener("mouseup", () => {
		isMouseMove = false;
	});
	canvas.addEventListener("mouseenter", (ev) => {
		mouseX = 2 * ev.clientX / canvas.width - 1;
		mouseY = 2 * (canvas.height - ev.clientY) / canvas.height - 1;
	});

	canvas.addEventListener("mousemove",  (ev) => {
		let x = 2 * ev.clientX / canvas.width - 1;
		let y = 2 * (canvas.height - ev.clientY) / canvas.height - 1;
		let dx = mouseX - x;
		let dy = mouseY - y;
		if (isMouseMove) {
			cameraPhi += dx * 2;
			cameraTheta += dy * 2;
			if (cameraTheta > Math.PI / 2) {
				cameraTheta = Math.PI / 2;
			}
			if (cameraTheta < -Math.PI / 2) {
				cameraTheta = -Math.PI / 2;
			}
			updateCamera();
		}
		mouseX = x;
		mouseY = y;

	});
	updateCamera();
}


//creating Terrain randomly from random Height Map or File
function chooseTerrainFromHeightMap(){
	let randomHeightMap = {
		width: 45,
		height: 45,
		rawData: []
	};

	const heightMapFromFile = { 
		width: nColumns,
		height: nRows, 
		rawData: rawData 
	};

	let terrain;
	let random = Boolean(Math.round(Math.random()));
//if random is true terrain is created from random Height Map
	if (random) {
		for (let i = 0; i < randomHeightMap.width * randomHeightMap.height; i++) {
			randomHeightMap.rawData.push(Math.round(Math.random() * 1000 - 200));
		}
		terrain = new GenerateTerrain(40.0, 40.0, randomHeightMap, materials["ground"]);
	} else {
//else it is created from file
		terrain = new GenerateTerrain(10.0, 10.0, heightMapFromFile, materials["ground"]);
	}
	return terrain;
}


//creating materials for objects
function createMaterials(){
	const landTexture = configureTexture(document.getElementById("landTextureImage"));
	const rockTexture = configureTexture(document.getElementById("rockTextureImage"));
	const snowTexture = configureTexture(document.getElementById("snowTextureImage"));
	const stoneTexture = configureTexture(document.getElementById("boxTextureImage"));
	const woodTexture = configureTexture(document.getElementById("woodTextureImage"));
	const desertTexture = configureTexture(document.getElementById("pyramidTextureImage"));
	const grassTexture = configureTexture(document.getElementById("grassTextureImage"));
	const earthTexture = configureTexture(document.getElementById("earthTextureImage"));
	const venusTexture = configureTexture(document.getElementById("venusTextureImage"));

	let sunMaterial = {
		diffuse: [0.0, 0.0, 0.0, 1.0],
		ambient: [1.0, 1.0, 0.5, 1.0]
	};

	let groundMaterial = {
		textures: [
			landTexture,
			rockTexture,
			snowTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let earthMaterial = {
		textures: [
			earthTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let venusMaterial = {
		textures: [
			venusTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};


	let stoneMaterial = {
		textures: [
			stoneTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let woodMaterial = {
		textures: [
			woodTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let desertMaterial = {
		textures: [
			desertTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let grassMaterial = {
		textures: [
			grassTexture
		],
		ambient: [0.2, 0.2, 0.2, 1.0]
	};

	let starMaterial = {
		diffuse: [0.0, 0.0, 0.0, 1.0],
		ambient: [0.8, 1.0, 1.0, 1.0]
	};

	let materials1 = [];

	materials1['ground'] =new Material(groundMaterial);
	materials1['sun'] = new Material(sunMaterial);
	materials1['earth'] =new Material(earthMaterial);
	materials1['venus'] =new Material(venusMaterial);
	materials1['stone'] =new Material(stoneMaterial);
	materials1['wood'] =new Material(woodMaterial);
	materials1['desert'] =new Material(desertMaterial);
	materials1['grass'] =new Material(grassMaterial);
	materials1['star'] =new Material(starMaterial);

	return materials1;
}
