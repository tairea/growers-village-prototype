import * as THREE from "three";

export class SceneManager {
  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.setupLights();
    this.objects = [];
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-1, 1, -1);
    this.scene.add(directionalLight2);
  }

  addToScene(object) {
    this.scene.add(object);
  }

  addObject(object) {
    this.objects.push(object);
    this.scene.add(object);
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
