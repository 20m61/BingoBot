import React, { Component } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader';

class VRMViewer extends Component {
  private mount: React.RefObject<HTMLDivElement>;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private controls: OrbitControls;
  private mixer: THREE.AnimationMixer | null;
  private vrm: VRM | null;
  private bvh: THREE.AnimationClip | null;

  constructor(props: {}) {
    super(props);
    this.mount = React.createRef();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      700
    );
    this.scene = new THREE.Scene();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.mixer = null;
    this.vrm = null;
    this.bvh = null;
  }

  componentDidMount() {
    // Create a scene
    const scene = new THREE.Scene();

    // Create a camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      700
    );
    camera.position.y = 1.5;
    camera.position.z = 3;

    // Create a directional light
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 5).normalize();
    scene.add(light);

    // Create a renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 1); // Add this line to set the background color
    this.mount.current?.appendChild(renderer.domElement);

    // Create OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // Load the background image
    const textureLoader = new THREE.TextureLoader();
    const backgroundImage = textureLoader.load('', () => {
      renderer.render(scene, camera);
    });

    // Set the background image
    scene.background = backgroundImage;

    // Create a GLTFLoader
    const loader = new GLTFLoader();

    // Install GLTFLoader plugin
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    window.addEventListener(
      'resize',
      () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );

    loader.load(
      // URL of the VRM you want to load
      './BingoChan.vrm',
      // called when the resource is loaded
      (gltf) => {
        // retrieve a VRM instance from gltf
        const vrm = gltf.userData.vrm;
        // add the loaded vrm to the scene
        scene.add(vrm.scene);
        // deal with vrm features
        console.log(vrm);

        // Load BVH file
        const bvhLoader = new BVHLoader();
        bvhLoader.load(
          // URL of the BVH file you want to load
          './dance.BVH',
          // called when the resource is loaded
          (result) => {
            // create an animation clip from the BVH data
            const clip = result.clip;
            // create an animation mixer
            const mixer = new THREE.AnimationMixer(vrm.scene);
            // add the animation clip to the mixer
            const action = mixer.clipAction(clip);
            // start the animation
            action.play();
            // store the mixer and animation clip for later use
            this.mixer = mixer;
            this.bvh = clip;

            // Change bone names and hierarchy to match VRM file
            const root = clip.tracks.find((track) =>
              track.name.endsWith('position')
            );
            if (root) {
              const rootName = root.name.replace('.position', '');
              const rootIndex =
                vrm.humanoid.getBoneNode(rootName).userData.index;
              clip.tracks = clip.tracks.map((track) => {
                const name = track.name.replace('.rotation', '');
                const bone = vrm.humanoid.getBoneNode(name);
                if (bone) {
                  const index = bone.userData.index;
                  const parent = bone.parent;
                  const parentIndex = parent ? parent.userData.index : -1;
                  const newName = `bones[${index}].rotation`;
                  const newValues = track.values;
                  if (index === rootIndex) {
                    newValues.slice(0, 3);
                  }
                  return new THREE.NumberKeyframeTrack(
                    newName,
                    track.times,
                    newValues
                  );
                } else {
                  return track;
                }
              });
            }
          },
          // called while loading is progressing
          (progress) =>
            console.log(
              'Loading BVH...',
              100.0 * (progress.loaded / progress.total),
              '%'
            ),
          // called when loading has errors
          (error) => console.error(error)
        );
      },
      // called while loading is progressing
      (progress) =>
        console.log(
          'Loading model...',
          100.0 * (progress.loaded / progress.total),
          '%'
        ),
      // called when loading has errors
      (error) => console.error(error)
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      if (this.mixer) {
        this.mixer.update(0.01);
      }
    };
    animate();
  }

  render() {
    return <div ref={this.mount} />;
  }
}

export default VRMViewer;
