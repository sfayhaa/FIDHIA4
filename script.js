import * as THREE from './js/three.module.js';
import { OrbitControls } from './js/OrbitControls.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import * as dat from './jsm/libs/dat.gui.module.js'
import { DragControls } from './js/DragControls.js';

class FogGUIHelper {
    constructor(fog, backgroundColor) {
        this.fog = fog;
        this.backgroundColor = backgroundColor;
    }
    get near() {
        return this.fog.near;
    }
    set near(v) {
        this.fog.near = v;
        this.fog.far = Math.max(this.fog.far, v);
    }
    get far() {
        return this.fog.far;
    }
    set far(v) {
        this.fog.far = v;
        this.fog.near = Math.min(this.fog.near, v);
    }
    get color() {
        return `#${this.fog.color.getHexString()}`;
    }
    set color(hexString) {
        this.fog.color.set(hexString);
        this.backgroundColor.set(hexString);
    }
}


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene();

// Dat GUI
const gui = new dat.GUI()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 100);
camera.position.x = -15;
camera.position.y = 10;
camera.position.z = 20;
scene.add(camera);

// orbit controls
const controls = new OrbitControls(camera, canvas);
controls.autoRotate = true;


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.render(scene, camera, controls);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaOutput = true;


/**
 * Panorama 
 */
const panorama = new THREE.CubeTextureLoader();
const textureSun = panorama.load([
    './assets/trance_ft.jpg', './assets/trance_bk.jpg',
    './assets/trance_up.jpg', './assets/trance_dn.jpg',
    './assets/trance_rt.jpg', './assets/trance_lf.jpg'
  ]);
scene.background = textureSun;

/**
 * Object: Plane
 */

 const loaderPlane = new THREE.TextureLoader();
 const plane = new THREE.Mesh(
   new THREE.PlaneGeometry(100, 100, 50, 50),
   new THREE.MeshPhongMaterial({
     color: 0xffffff,
     map: loaderPlane.load('./assets/rumput.jfif')
     })
 );
 plane.rotation.x = -Math.PI*0.5;
 plane.position.set(0, 0, 0);
 plane.receiveShadow = true;
 scene.add(plane);


/**
 * Object: GLTF
 */


const loader2 = new GLTFLoader()
loader2.load('./assets/scene.gltf', function(gltf) {
    const root = gltf.scene;
    root.position.x = 0;
    root.position.y = 5;
    scene.add(root);

    root.traverse(n => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });

})

const loaderti = new GLTFLoader()
loaderti.load('./coba/scene.gltf', function(gltf) {
    const root = gltf.scene;
    root.position.x = 5;
    root.position.y = -5;
    scene.add(root);

    root.traverse(n => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });

})

/**
 * Lights
 */
 const pointLight = new THREE.PointLight(0xffffff);
 pointLight.position.set(-100, 200, 100);
 scene.add(pointLight);

 const ambientLight = new THREE.AmbientLight(0x000000);
 scene.add(ambientLight);

 const directionalLight = new THREE.DirectionalLight();
 directionalLight.position.set(-600, 500, 500);
 directionalLight.castShadow = true;
 directionalLight.intensity = 2;
 directionalLight.shadow.mapSize.width = 1024;
 directionalLight.shadow.mapSize.height = 1024;
 directionalLight.shadow.camera.near = 250;
 directionalLight.shadow.camera.far = 1000;

 const intensity = 50;

 directionalLight.shadow.camera.left = -intensity;
 directionalLight.shadow.camera.right = intensity;
 directionalLight.shadow.camera.top = intensity;
 directionalLight.shadow.camera.bottom = -intensity;
 scene.add(directionalLight);

/**
 * Fog
 */

 const color = 0xffffff;
 const near = 90;
 const far = 160;
 scene.fog = new THREE.Fog(color, near, far);

/**
 * Object: Reflective Sphere
 */
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
let sphereCamera = new THREE.CubeCamera(1, 500, cubeRenderTarget);
sphereCamera.position.set(-3, 3, 0);
scene.add(sphereCamera);
const sphereMirror = new THREE.MeshBasicMaterial({
    envMap: sphereCamera.renderTarget.texture,
});
const sphereGeo = new THREE.SphereGeometry(1.5, 32, 16);
const mirrorBall = new THREE.Mesh(sphereGeo, sphereMirror);
mirrorBall.position.y = 3;
mirrorBall.position.x = -3;
scene.add(mirrorBall);

/**
 * Drag Controls
 */


const dragGeo = new THREE.BoxGeometry()
const dragMaterial = [
    new THREE.MeshPhongMaterial({ color: 'green', transparent: true }),
]

const cubes = [
    new THREE.Mesh(dragGeo, dragMaterial[0]),
]
cubes[0].position.set(3, -5, 10)

cubes.forEach((c) => scene.add(c))

const dragControls = new DragControls(cubes, camera, canvas)

dragControls.addEventListener('dragstart', function() { controls.enabled = false; });
dragControls.addEventListener('dragend', function() { controls.enabled = true; });

renderer.render(scene, camera, dragControls);


/**
 * Animate
 */

const tick = () => {

    // Update Orbital Controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    sphereCamera.update(renderer, scene);
    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}
tick();
