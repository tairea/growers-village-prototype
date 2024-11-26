import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

export class ControlsManager {
  constructor(camera, renderer, app) {
    this.camera = camera;
    this.renderer = renderer;
    this.app = app;
    this.orbit = new OrbitControls(camera.camera, renderer.getDomElement());

    // Simple click handler for flying mode
    this.renderer.getDomElement().addEventListener("pointerdown", () => {
      if (this.camera.isFlying) {
        this.camera.isFlying = false;
        const flyBtn = document.getElementById("flyView");
        if (flyBtn) {
          flyBtn.textContent = "Fly";
        }
        this.orbit.enabled = true;
      }
    });

    this.isMouseDown = false;
    this.mousePosition = new THREE.Vector2();
    this.isAddingCrops = false;
    this.isSelectingRow = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedTiles = new Set();

    this.setupOrbitControls();
    this.updateCameraPositionUI();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupEventListeners()
      );
    } else {
      this.setupEventListeners();
    }
  }

  setupOrbitControls() {
    this.orbit.update();
    this.orbit.addEventListener("change", () => this.updateCameraPositionUI());
  }

  setupEventListeners() {
    // Mouse events
    window.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    window.addEventListener("mouseup", () => this.handleMouseUp());
    window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    window.addEventListener("resize", () => this.handleResize());

    // View buttons
    const addRowBtn = document.getElementById("addRowBtn");
    const isoViewBtn = document.getElementById("isoView");
    const flyViewBtn = document.getElementById("flyView");
    const addCropBtn = document.getElementById("addCropBtn");
    const watermelonBtn = document.getElementById("watermelonBtn");
    const tomatoBtn = document.getElementById("tomatoBtn");
    const rowModal = document.getElementById("rowModal");
    const saveRowBtn = document.getElementById("saveRow");
    const cancelRowBtn = document.getElementById("cancelRow");

    if (addRowBtn) {
      addRowBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isSelectingRow = !this.isSelectingRow;
        addRowBtn.textContent = this.isSelectingRow
          ? "Cancel Row Selection"
          : "Add Row";

        if (this.isSelectingRow) {
          this.orbit.enabled = false;
          this.camera.animateCamera(
            this.camera.viewPositions.top,
            this.camera.viewRotations.top,
            2000,
            "top"
          );
          this.selectedTiles.clear();
        } else {
          this.clearSelection();
        }
      });
    }

    if (isoViewBtn) {
      isoViewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isMouseDown = false;
        this.orbit.enabled = true;
        this.camera.animateCamera(
          this.camera.viewPositions.iso,
          this.camera.viewRotations.iso,
          2000,
          "iso"
        );
      });
    }

    if (flyViewBtn) {
      flyViewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isMouseDown = false;
        this.camera.startFlyingCamera();
      });
    }

    if (addCropBtn) {
      addCropBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isAddingCrops = !this.isAddingCrops;
        addCropBtn.textContent = this.isAddingCrops
          ? "Cancel Adding Crops"
          : "Add Crop";

        if (this.isAddingCrops) {
          this.orbit.enabled = false;
          this.camera.animateCamera(
            this.camera.viewPositions.top,
            this.camera.viewRotations.top,
            2000,
            "top"
          );
        }
      });
    }

    // Model selection buttons
    if (watermelonBtn) {
      watermelonBtn.addEventListener("click", (e) => {
        this.app.models.selectedModel = "watermelon";
        this.updateModelButtonStyles(e.target);
      });
    }

    if (tomatoBtn) {
      tomatoBtn.addEventListener("click", (e) => {
        this.app.models.selectedModel = "tomato";
        this.updateModelButtonStyles(e.target);
      });
    }

    if (saveRowBtn) {
      saveRowBtn.addEventListener("click", () => {
        const name = document.getElementById("rowName").value;
        const description = document.getElementById("rowDescription").value;
        this.saveRow(name, description);
        rowModal.style.display = "none";
        this.clearSelection();
      });
    }

    if (cancelRowBtn) {
      cancelRowBtn.addEventListener("click", () => {
        rowModal.style.display = "none";
        this.clearSelection();
      });
    }
  }

  handleMouseDown(event) {
    if (event.target.tagName === "BUTTON") {
      return;
    }

    if (this.camera.currentView === "top" && !this.camera.isFlying) {
      if (this.isSelectingRow) {
        this.isMouseDown = true;
        this.updateMousePosition(event);
        this.selectionStart = this.app.grid.getGridPosition(
          this.mousePosition,
          this.camera.camera
        );
      } else if (this.isAddingCrops) {
        this.isMouseDown = true;
        this.updateMousePosition(event);
        this.app.grid.placeSphereAtHighlight();
      }
    }
  }

  handleMouseUp() {
    if (this.isSelectingRow && this.isMouseDown) {
      const rowModal = document.getElementById("rowModal");
      if (this.selectedTiles.size > 0) {
        rowModal.style.display = "block";
      }
    }
    this.isMouseDown = false;
  }

  updateMousePosition(event) {
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  handleMouseMove(event) {
    if (this.camera.currentView !== "top") {
      this.app.grid.highlightMesh.visible = false;
      return;
    }

    this.updateMousePosition(event);

    if (this.isSelectingRow && this.isMouseDown) {
      this.selectionEnd = this.app.grid.getGridPosition(
        this.mousePosition,
        this.camera.camera
      );
      this.updateSelection();
    } else if (this.isAddingCrops) {
      this.app.grid.highlightMesh.visible = true;
      this.app.grid.updateHighlight(this.mousePosition, this.camera.camera);
      if (this.isMouseDown) {
        this.app.grid.placeSphereAtHighlight();
      }
    }
  }

  handleResize() {
    this.camera.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.camera.updateProjectionMatrix();
    this.renderer.handleResize();
  }

  updateCameraPositionUI() {
    const pos = this.camera.camera.position;
    const rot = this.camera.camera.rotation;
    const cameraInfo = document.getElementById("cameraInfo");
    if (cameraInfo) {
      cameraInfo.innerHTML = `
                Position: 
                x: ${pos.x.toFixed(2)}
                y: ${pos.y.toFixed(2)}
                z: ${pos.z.toFixed(2)}
                <br>
                Rotation: 
                x: ${((rot.x * 180) / Math.PI).toFixed(2)}°
                y: ${((rot.y * 180) / Math.PI).toFixed(2)}°
                z: ${((rot.z * 180) / Math.PI).toFixed(2)}°
            `;
    }
  }

  updateModelButtonStyles(selectedButton) {
    const buttons = document.querySelectorAll(".model-btn");
    if (buttons) {
      buttons.forEach((btn) => {
        btn.classList.remove("selected");
      });
      selectedButton.classList.add("selected");
    }
  }

  updateSelection() {
    if (!this.selectionStart || !this.selectionEnd) return;

    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minZ = Math.min(this.selectionStart.z, this.selectionEnd.z);
    const maxZ = Math.max(this.selectionStart.z, this.selectionEnd.z);

    this.selectedTiles.clear();

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        this.selectedTiles.add(`${x},${z}`);
        // Highlight selected tiles (you'll need to implement this in GridManager)
        this.app.grid.highlightTile(x, z);
      }
    }
  }

  clearSelection() {
    this.isSelectingRow = false;
    this.selectedTiles.clear();
    this.selectionStart = null;
    this.selectionEnd = null;
    document.getElementById("addRowBtn").textContent = "Add Row";
    // Clear tile highlights (you'll need to implement this in GridManager)
    this.app.grid.clearHighlights();
  }

  saveRow(name, description) {
    // Save the row data
    const rowData = {
      name,
      description,
      tiles: Array.from(this.selectedTiles),
    };
    console.log("Saving row:", rowData);
    // Here you would typically save this to your database or state management system

    this.isSelectingRow = false;
    document.getElementById("addRowBtn").textContent = "Add Row";
    document.getElementById("rowName").value = "";
    document.getElementById("rowDescription").value = "";
  }
}

export function setupEventListeners(app) {
  return new ControlsManager(app.camera, app.scene, app);
}
