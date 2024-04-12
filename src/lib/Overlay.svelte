<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	let canvasElement: HTMLCanvasElement;

	let scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		renderer: THREE.WebGLRenderer,
		plane: THREE.Mesh;

	onMount(() => {
		scene = new THREE.Scene();
		camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
		renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
		renderer.setClearAlpha(0.0);

		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		const texture = new THREE.TextureLoader().load('/waterNormal.jpg');
		const planeGeometry = new THREE.PlaneGeometry(2, 2);
		const planeMaterial = new THREE.ShaderMaterial({
			uniforms: {
				iTime: { value: 0 },
				time: { value: 0 },
				iResolution: { value: new THREE.Vector2() }
			},
			vertexShader: `
                varying vec2 vUv;
				void main() {
                    gl_Position = vec4(position, 1.0);
                    vUv = uv;
				}
			`,
			fragmentShader: `
            uniform float iTime;
            uniform vec2 iResolution;
            uniform vec4 iMouse;
            uniform sampler2D iChannel0;

            const float DOTS = 12.0;
            const vec3 COLOR = vec3(0.325, 0.694, 0.992);

            void mainImage(out vec4 fragColor, in vec2 fragCoord)
            {
                vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

                float f = 0.0;
                
                // Update the calculation in the loop to smooth the flow of glowing dots.
                for(float i = 1.0; i <= DOTS; i++)
                {
                    float s = sin(0.1 * iTime + (i / DOTS) * iTime) * 0.2;
                    float c = cos(0.2 * iTime + (i / DOTS) * iTime) * 0.2 ;
                    f += 0.01 / abs(length(p*0.5 + vec2(c, s)));
                }
                
                fragColor = vec4(COLOR*f, 1.0);
            }

            void main() {
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }
			`
		});
		plane = new THREE.Mesh(planeGeometry, planeMaterial);
		scene.add(plane);

		planeMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);

		camera.position.z = 5;

		const clock = new THREE.Clock();

		const animate = () => {
			requestAnimationFrame(animate);

			const time = clock.getElapsedTime() * 5;

			// Update uniforms
			planeMaterial.uniforms.iTime.value = time; // Assuming clock is a THREE.Clock instance

			renderer.render(scene, camera);
		};

		animate();

		return () => {
			document.body.removeChild(renderer.domElement);
			scene.traverse((object) => {
				if (object.geometry) {
					object.geometry.dispose();
				}
				if (object.material) {
					object.material.dispose();
				}
			});

			renderer.dispose();
		};
	});
</script>

<canvas bind:this={canvasElement} style="overlay" width="100%" height="100%"></canvas>

<style>
	canvas {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
