import { SceneManager } from "./modules/scene";
import { CameraManager } from "./modules/camera";
import { GridManager } from "./modules/grid";
import { ModelManager } from "./modules/models";
import { setupEventListeners } from "./modules/controls";

class App {
  constructor() {
    this.scene = new SceneManager();
    this.camera = new CameraManager();
    this.models = new ModelManager(this.scene);
    this.grid = new GridManager(this.scene, this.models);
    this.controls = setupEventListeners(this);

    document.body.appendChild(this.scene.getDomElement());

    this.models.loadModels();

    this.animate();
  }

  animate(time) {
    if (this.grid.highlightMesh) {
      this.grid.highlightMesh.material.opacity = 1 + Math.sin(time / 120);
    }

    if (this.camera.isFlying) {
      this.camera.updateFlyingCamera();
    }

    this.scene.render(this.camera.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
}

// Initialize the application
const app = new App();
