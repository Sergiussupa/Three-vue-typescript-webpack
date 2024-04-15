  <template>
    <div id="app">
      <div class="control-panel">
        <select v-model="selectedModel" @change="loadModel">
          <option value="chair.glb">Стул</option>
          <option value="cube.glb">Куб</option>
          <option value="helmet.glb">Шлем</option>
          <option value="suzanne.glb">Сюзанна</option>
        </select>
        <select v-model="selectedTexture" @change="updateMaterial">
          <option value="metal">Металл</option>
          <option value="wood">Дерево</option>
          <option value="leather">Кожа</option>
          <option value="velours">Велюр</option>
        </select>
        <button @click="addMesh">Add Mesh</button>
        <input v-model.number="posX" type="number" step="0.01" placeholder="X Position" />
        <input v-model.number="posY" type="number" step="0.01" placeholder="Y Position" />
        <input v-model.number="posZ" type="number" step="0.01" placeholder="Z Position" />
      </div>
      <canvas ref="canvas"></canvas>
    </div>
  </template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

export default defineComponent({
  setup() {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const camera = ref(null);
    const selectedModel = ref("cube.glb");
    const selectedTexture = ref("metal");
    const scene = new THREE.Scene();
    const meshes = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const posX = ref(0.0);
    const posY = ref(0.0);
    const posZ = ref(0.0);

    const textureLoader = new THREE.TextureLoader();
    const ktx2Loader = new KTX2Loader().setTranscoderPath('/basis/');
    const loader = new GLTFLoader();

    // Функция для загрузки текстур с логированием
    const loadTexture = (path, format) => {
      console.log(`Loading texture: ${path} with format ${format}`);
      if (format === 'ktx2') {
        return ktx2Loader.load(path, (texture) => {
          console.log(`Texture loaded successfully: ${path}`);
          return texture;
        }, undefined, (error) => {
          console.error(`Error loading texture: ${path}`, error);
        });
      } else {
        return textureLoader.load(path, (texture) => {
          console.log(`Texture loaded successfully: ${path}`);
          return texture;
        }, undefined, (error) => {
          console.error(`Error loading texture: ${path}`, error);
        });
      }
    };

    // Предзагрузка всех текстур
    const textures = {};
    const loadTextures = () => {
      ['metal', 'wood', 'leather', 'velours'].forEach(type => {
        const format = type === 'leather' ? 'ktx2' : 'png';
        textures[type] = {
          albedo: loadTexture(`/textures/albedo/albedo-${type}.${format}`, format),
          normal: loadTexture(`/textures/normal/normal-${type}.${format}`, format),
          roughness: loadTexture(`/textures/roughness/roughness-${type}.${format}`, format),
          metalness: loadTexture(`/textures/metalness/metalness-${type}.${format}`, format)
        };
      });
    };

    let transformControls;
    let orbitControls;

    onMounted(() => {
      if (!canvas.value) return;
      camera.value = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.value.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ canvas: canvas.value });
      renderer.setSize(window.innerWidth, window.innerHeight);

      orbitControls = new OrbitControls(camera.value, renderer.domElement);
      transformControls = new TransformControls(camera.value, renderer.domElement);
      scene.add(transformControls);
      transformControls.addEventListener('dragging-changed', event => {
        orbitControls.enabled = !event.value;
      });

      transformControls.addEventListener('change', () => {
        if (transformControls.object) {
          posX.value = parseFloat(transformControls.object.position.x.toFixed(2));
          posY.value = parseFloat(transformControls.object.position.y.toFixed(2));
          posZ.value = parseFloat(transformControls.object.position.z.toFixed(2));
          console.log('Position updated:', posX.value, posY.value, posZ.value);
        }
      });

      scene.background = new THREE.Color(0xaaaaaa);
      const gridHelper = new THREE.GridHelper(10, 10);
      gridHelper.position.y = -1;
      scene.add(gridHelper);

      const light = new THREE.DirectionalLight(0xff0000, 1.0);
      light.position.set(-5, 5, 5);
      scene.add(light);

      const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
      scene.add(hemisphereLight);

      ktx2Loader.detectSupport(renderer);

      loadTextures();

      function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera.value);
      }
      animate();

      window.addEventListener('click', onDocumentMouseDown, false);
    });

    const onDocumentMouseDown = (event) => {
      event.preventDefault();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera.value);
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        transformControls.attach(object.parent);

        console.log('Object attached for transformation:', object.parent);
      }
    };

    const addMesh = () => {
      loader.load(`/models/${selectedModel.value}`, (gltf) => {
        const newMesh = gltf.scene;
        const material = new THREE.MeshStandardMaterial({
          map: textures[selectedTexture.value].albedo,
          normalMap: textures[selectedTexture.value].normal,
          roughnessMap: textures[selectedTexture.value].roughness,
          metalnessMap: textures[selectedTexture.value].metalness
        });
        newMesh.traverse((child) => {
          if (child.isMesh) {
            child.material = material;
          }
        });

        newMesh.position.set(
          parseFloat((1.0).toFixed(2)),
          parseFloat((1.0).toFixed(2)),
          parseFloat((1.0).toFixed(2))
        );

        scene.add(newMesh);
        meshes.push(newMesh); // Store the reference to manage later
      });
    };

    return { canvas, selectedModel, selectedTexture, addMesh };
  }
});
</script>


  <style scoped>
  #app {
    position: relative;
    width: 100%;
    height: 100vh;
  }

  .control-panel {
    position:absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .control-panel select, .control-panel button {
    padding: 8px;
    margin: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
    background-color: white;
    cursor: pointer;
  }

  .control-panel button {
    background-color: #f8f8f8;
  }

  canvas {
    display: block; /* Removes extra margin/padding */
    width: 100%;
    height: 100%;
  }
  </style>