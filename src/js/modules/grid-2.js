import * as THREE from "three";

export class GridManager {
  constructor(scene, modelManager) {
    this.scene = scene;
    this.modelManager = modelManager;
    this.setupGrid();
    this.setupPlaneMesh();
    this.setupHighlightMesh();

    this.raycaster = new THREE.Raycaster();
    this.mousePosition = new THREE.Vector2();
    this.placedObjects = new Map(); // Track placed objects by position
  }

  setupGrid() {
    // Create first 20x20 grid
    const grid1 = new THREE.GridHelper(20, 20);
    grid1.position.x = -11; // Move left by 11 units

    // Create second 20x20 grid
    const grid2 = new THREE.GridHelper(20, 20);
    grid2.position.x = 11; // Move right by 11 units

    this.scene.addToScene(grid1);
    this.scene.addToScene(grid2);
  }

  setupPlaneMesh() {
    this.planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(42, 20),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false,
      })
    );
    this.planeMesh.rotateX(-Math.PI / 2);
    this.scene.addToScene(this.planeMesh);
  }

  setupHighlightMesh() {
    this.highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        color: 0x808080,
      })
    );
    this.highlightMesh.rotateX(-Math.PI / 2);
    this.highlightMesh.position.set(0.5, 0, 0.5);
    this.scene.addToScene(this.highlightMesh);
  }

  getPositionKey(position) {
    return `${Math.round(position.x)},${Math.round(position.z)}`;
  }

  placeSphereAtHighlight() {
    if (!this.highlightMesh) return;

    const posKey = this.getPositionKey(this.highlightMesh.position);
    if (this.placedObjects.has(posKey)) {
      console.log("Position already occupied");
      return;
    }

    const modelClone = this.modelManager.placeModel(
      this.highlightMesh.position
    );
    if (modelClone) {
      this.scene.addObject(modelClone);
      this.placedObjects.set(posKey, modelClone);
      this.highlightMesh.material.color.setHex(0xff0000);
      console.log("Model placed at", posKey);
    }
  }

  updateHighlight(mousePosition, camera) {
    this.mousePosition.copy(mousePosition);
    this.raycaster.setFromCamera(this.mousePosition, camera);
    const intersects = this.raycaster.intersectObject(this.planeMesh);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const highlightPos = new THREE.Vector3()
        .copy(intersect.point)
        .floor()
        .addScalar(0.5);
      this.highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

      // Update highlight color based on whether position is occupied
      const posKey = this.getPositionKey(this.highlightMesh.position);
      this.highlightMesh.material.color.setHex(
        this.placedObjects.has(posKey) ? 0xff0000 : 0x808080
      );
    }
  }
}
