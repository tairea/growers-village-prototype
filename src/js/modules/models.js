import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

// Import model files using URLs
const watermelonMTL = new URL("../../models/watermelon.mtl", import.meta.url);
const watermelonOBJ = new URL("../../models/watermelon.obj", import.meta.url);
const watermelonTexture = new URL(
  "../../models/watermelon.jpg",
  import.meta.url
);
const tomatoMTL = new URL("../../models/tomato.mtl", import.meta.url);
const tomatoOBJ = new URL("../../models/tomato.obj", import.meta.url);
const tomatoTexture = new URL("../../models/tomato.jpg", import.meta.url);

export class ModelManager {
  constructor(scene) {
    this.scene = scene;
    this.mtlLoader = new MTLLoader();
    this.objLoader = new OBJLoader();
    this.models = {
      watermelon: null,
      tomato: null,
    };
    this.selectedModel = "watermelon";
    this.modelsLoaded = { watermelon: false, tomato: false };

    // Define model configurations using URL paths
    this.modelConfigs = {
      watermelon: {
        mtl: watermelonMTL.href,
        obj: watermelonOBJ.href,
        texture: watermelonTexture.href,
        scale: { x: 0.04, y: 0.04, z: 0.04 },
        rotation: { x: Math.PI, y: 0, z: 0 },
      },
      tomato: {
        mtl: tomatoMTL.href,
        obj: tomatoOBJ.href,
        texture: tomatoTexture.href,
        scale: { x: 0.04, y: 0.04, z: 0.04 },
        rotation: { x: -Math.PI / 2, y: 0, z: Math.PI },
      },
    };
  }

  loadModels() {
    Object.entries(this.modelConfigs).forEach(([modelName, config]) => {
      this.loadModel(modelName, config);
    });
  }

  loadModel(modelName, config) {
    this.mtlLoader.load(
      config.mtl,
      (materials) => {
        const textureLoader = new THREE.TextureLoader();
        materials.preload();
        this.objLoader.setMaterials(materials);

        textureLoader.load(
          config.texture,
          (texture) => {
            const material = new THREE.MeshPhongMaterial({
              map: texture,
              color: 0xffffff,
              specular: 0x111111,
              shininess: 25,
            });

            this.objLoader.load(
              config.obj,
              (object) => {
                this.models[modelName] = object;

                object.scale.set(
                  config.scale.x,
                  config.scale.y,
                  config.scale.z
                );
                object.rotation.set(
                  config.rotation.x,
                  config.rotation.y,
                  config.rotation.z
                );

                object.traverse((child) => {
                  if (child.isMesh) {
                    child.material = material;
                  }
                });

                this.modelsLoaded[modelName] = true;

                this.checkAndCreateUI();
              },
              (xhr) => {},
              (error) => {}
            );
          },
          undefined,
          (error) => {}
        );
      },
      undefined,
      (error) => {}
    );
  }

  checkAndCreateUI() {
    if (this.modelsLoaded.watermelon && this.modelsLoaded.tomato) {
      const watermelonBtn = document.getElementById("watermelonBtn");
      const tomatoBtn = document.getElementById("tomatoBtn");

      if (watermelonBtn) watermelonBtn.disabled = false;
      if (tomatoBtn) tomatoBtn.disabled = false;
    }
  }

  getSelectedModel() {
    const model = this.models[this.selectedModel];
    if (!model) {
      return null;
    }
    return model;
  }

  placeModel(position) {
    const currentModel = this.getSelectedModel();
    if (!currentModel) {
      return null;
    }

    const modelClone = currentModel.clone();
    const bbox = new THREE.Box3().setFromObject(modelClone);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    modelClone.position.copy(position);
    modelClone.position.x -= center.x;
    modelClone.position.z -= center.z;
    modelClone.position.y = 0;

    return modelClone;
  }
}
