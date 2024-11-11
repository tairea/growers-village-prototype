import * as THREE from "three";

export class CameraManager {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.viewPositions = {
      top: { x: 0, y: 30, z: 0 },
      iso: { x: 10, y: 15, z: -22 },
    };

    this.viewRotations = {
      top: { x: -Math.PI / 2, y: 0, z: Math.PI },
      iso: null, // Will be set after initial camera setup
    };

    this.currentView = "iso";
    this.isFlying = false;
    this.flyingRadius = 25;
    this.flyingAngle = 0;
    this.flyingSpeed = 0.003;

    this.setupInitialPosition();
  }

  setupInitialPosition() {
    const { x, y, z } = this.viewPositions.iso;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
    this.viewRotations.iso = {
      x: this.camera.rotation.x,
      y: this.camera.rotation.y,
      z: this.camera.rotation.z,
    };
  }

  // Helper function to normalize angles
  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  animateCamera(
    targetPosition,
    targetRotation,
    duration = 2000,
    viewType = "iso"
  ) {
    if (this.isFlying) {
      this.isFlying = false;
      const flyBtn = document.getElementById("flyView");
      if (flyBtn) {
        flyBtn.textContent = "Fly";
      }
      targetPosition = this.viewPositions.iso;
      targetRotation = this.viewRotations.iso;
      viewType = "iso";
    }

    const startPosition = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };

    const startRotation = {
      x: this.camera.rotation.x,
      y: this.camera.rotation.y,
      z: this.camera.rotation.z,
    };

    // Calculate the shortest rotation path
    const rotationDiffs = {
      x: this.normalizeAngle(targetRotation.x - startRotation.x),
      y: this.normalizeAngle(targetRotation.y - startRotation.y),
      z: this.normalizeAngle(targetRotation.z - startRotation.z),
    };

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      // Update position
      this.camera.position.set(
        startPosition.x + (targetPosition.x - startPosition.x) * easeProgress,
        startPosition.y + (targetPosition.y - startPosition.y) * easeProgress,
        startPosition.z + (targetPosition.z - startPosition.z) * easeProgress
      );

      // Always interpolate rotation during animation, regardless of view type
      this.camera.rotation.set(
        startRotation.x + rotationDiffs.x * easeProgress,
        startRotation.y + rotationDiffs.y * easeProgress,
        startRotation.z + rotationDiffs.z * easeProgress
      );

      // Update camera info UI during animation
      const cameraInfo = document.getElementById("cameraInfo");
      if (cameraInfo) {
        cameraInfo.innerHTML = `
          Position: 
          x: ${this.camera.position.x.toFixed(2)}
          y: ${this.camera.position.y.toFixed(2)}
          z: ${this.camera.position.z.toFixed(2)}
          <br>
          Rotation: 
          x: ${((this.camera.rotation.x * 180) / Math.PI).toFixed(2)}°
          y: ${((this.camera.rotation.y * 180) / Math.PI).toFixed(2)}°
          z: ${((this.camera.rotation.z * 180) / Math.PI).toFixed(2)}°
        `;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure final position and rotation are exact
        this.camera.position.set(
          targetPosition.x,
          targetPosition.y,
          targetPosition.z
        );

        this.camera.rotation.set(
          targetRotation.x,
          targetRotation.y,
          targetRotation.z
        );

        this.currentView = viewType;
      }
    };

    animate();
  }

  updateFlyingCamera() {
    if (!this.isFlying) return;

    this.flyingAngle += this.flyingSpeed;
    this.camera.position.x = Math.cos(this.flyingAngle) * this.flyingRadius;
    this.camera.position.z = Math.sin(this.flyingAngle) * this.flyingRadius;
    this.camera.position.y = 15;
    this.camera.lookAt(0, 0, 0);

    // Update camera info UI during flying
    const cameraInfo = document.getElementById("cameraInfo");
    if (cameraInfo) {
      cameraInfo.innerHTML = `
        Position: 
        x: ${this.camera.position.x.toFixed(2)}
        y: ${this.camera.position.y.toFixed(2)}
        z: ${this.camera.position.z.toFixed(2)}
        <br>
        Rotation: 
        x: ${((this.camera.rotation.x * 180) / Math.PI).toFixed(2)}°
        y: ${((this.camera.rotation.y * 180) / Math.PI).toFixed(2)}°
        z: ${((this.camera.rotation.z * 180) / Math.PI).toFixed(2)}°
      `;
    }
  }

  startFlyingCamera() {
    this.isFlying = !this.isFlying;
    const flyBtn = document.getElementById("flyView");
    if (flyBtn) {
      flyBtn.textContent = this.isFlying ? "Stop" : "Fly";
    }
  }
}
