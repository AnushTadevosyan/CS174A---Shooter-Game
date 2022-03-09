import { defs, tiny } from './examples/common.js';
import { Bullet, Enemy, Player, Star } from './Actor.js';
import {Actor_Manager} from './Actor_Manager.js';
import { Text_Line } from './examples/text-demo.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            text: new Text_Line(15),
            text2: new Text_Line(15),
            bumpy_asteroid: new Shape_From_File("assets/bumpy_aster.obj"),
            round_asteroid: new Shape_From_File("assets/round_asteroid.obj"),
            spaceship: new Shape_From_File("assets/rocket.obj")

            //text3: new Text_Line(15)
        };

        this.model_transform = Mat4.identity().times(Mat4.translation(-15, -1, 0));

        //this.blaster = new defs.Subdivision_Sphere(4);


        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#ffffff") }),
            test2: new Material(new Gouraud_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#992828") }),
            ring: new Material(new Ring_Shader()),

            text_mat: new Material(new defs.Textured_Phong(1),
                { ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png") })
        };

        this.initial_camera_location = Mat4.translation(5, 0, -20).times(Mat4.rotation(0, 0, 0, -90));

        this.start = false;
        this.init_game_systems();

        this.actor_type_material = new Map();
        this.actor_type_material.set(
            Player.get_type_static(), new Material(new defs.Phong_Shader(), 
            { ambient: .4, diffusivity: .6, color: hex_color("#fac91a") })
        );
        this.actor_type_material.set(
            Enemy.get_type_static(), new Material(new defs.Phong_Shader(), 
            { ambient: .4, diffusivity: .6, color: hex_color("#FF0000") })
        );
        this.actor_type_material.set(
            Bullet.get_type_static(), new Material(new defs.Phong_Shader(), 
            { ambient: .4, diffusivity: .6, color: hex_color("#00FF00") })
        );
        this.actor_type_material.set(
            Star.get_type_static(), new Material(new defs.Phong_Shader(), 
            { ambient: 1, diffusivity: .6, color: hex_color("#FFFFFF") })
        );

        this.controls = new Map();
        this.controls["up"] = false;
        this.controls["down"] = false;
        
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        // this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        // this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        // this.new_line();
        // this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        // this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        // this.new_line();
        // this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);


        this.key_triggered_button("New Game", ["g"], () => this.reset());
        //this.key_triggered_button("Hard Mode/Endless Mode", ["h"], () => {this.hm = !this.hm});
        this.key_triggered_button("Pause/Unpause", ["u"], () => {this.paused = !this.paused});
        this.key_triggered_button("Move Up", ["ArrowUp"], () => { this.controls["up"] = true; }, undefined, () => { this.controls["up"] = false; });
        this.key_triggered_button("Move Down", ["ArrowDown"], () => { this.controls["down"] = true; }, undefined, () => { this.controls["down"] = false; });
        //this.key_triggered_button("Move Right", ["]"], this.move_right);
        //this.key_triggered_button("Move Left", ["["], this.move_left);
        this.key_triggered_button("Shoot", ["j"], () => { this.shoot_bullet(0) });
        this.key_triggered_button("Lock Screen", ["q"], () => {this.lock_screen = !this.lock_screen});

        // debug
        // this.key_triggered_button("Spawn Enemy", ["b"], () => { this.actor_manager.add_actor(new Enemy(Math.floor(Math.random() * 15 - 3), .3, 5)); });
    }

    my_mouse_down(e, pos, context, program_state) {
        //HARD CODED BASED ON SCREEN DIMENSIONS: (-20<x<9, -7.5<y<7.5)
        //IF SCREEN DIMENSIONS CHANGE, THIS NEEDS TO BE CHANGED
        let mouse_x = (pos[0] * 15) - 5.5;
        let mouse_y = (pos[1] * 7.5);

        let x_diff = (mouse_x - this.player.coords.x);
        let y_diff = (mouse_y - this.player.coords.y);
        let bullet_angle = Math.atan(y_diff/x_diff);

        if (x_diff > 0) 
            this.shoot_bullet(bullet_angle);
    }

    move_up() {
        if(this.player.coords.y<7.5 && !this.paused)
            this.player.move_up();
    }

    move_down() {
        if(this.player.coords.y>-7.5 && !this.paused)
            this.player.move_down();
    }

/*     move_right() {
        if(this.player.coords.x<9 && !this.paused)
            this.player.move_right();
    }

    move_left() {
        if(this.player.coords.x>-20 && !this.paused)
            this.player.move_left();
    } */
    
    reset() {
        this.start = true;
        this.init_game_systems();
    }

    init_game_systems() {
        //refresh everything
        //this.hm = false;
        this.alive = true;
        this.paused = false;
        this.lock_screen = false;
        this.kills = 0;
        this.lives = 3;
        this.player = new Player(this.controls);
        this.actor_manager = new Actor_Manager();
        this.actor_manager.add_actor(this.player);
        this.actor_manager.add_category(Enemy.get_type_static());
        this.actor_manager.add_category(Bullet.get_type_static());

        this.player.shape = this.shapes.spaceship
    }

    shoot_bullet(angle) {
        let c = this.player.get_coordinates();
        this.actor_manager.add_actor(new Bullet({ x: c.x, y: c.y, z: c.z }, .2, 6, angle));
    }

    draw_actor(actor, shape, mat, context, program_state) {
        let coords = actor.get_coordinates();
        let s = actor.get_radius();
        if (actor.shape)
            shape = actor.shape;
        if (actor.material)
            mat = actor.material
        let model_transform = Mat4.translation(coords.x, coords.y, coords.z).times(actor.get_rotation_matrix()).times(Mat4.scale(s, s, s));
        shape.draw(context, program_state, model_transform, mat);
    }

    display(context, program_state) {

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            program_state.set_camera(this.initial_camera_location);

            // Mouse picking
            let canvas = context.canvas;
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                    (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

            canvas.addEventListener("mousedown", e => {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                this.my_mouse_down(e, mouse_position(e), context, program_state);
            });

        }   

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const light_position = vec4(0, 5, 5, 1);

        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000, dt = (this.paused) ? 0 : (program_state.animation_delta_time / 1000);
        
        //player has begun the game
        if(this.alive && this.start) { 

            if (this.lock_screen) {
                program_state.set_camera(Mat4.translation(5, 0, -20).times(Mat4.rotation(0, 0, 0, -90)));
            }

            this.actor_manager.update_actor_list(t, dt);

            // draw actors that are allive
            let curr_actor_node = this.actor_manager.actor_list.head;

            while (curr_actor_node != null) {
                let curr_actor = curr_actor_node.item;
                if (curr_actor.is_alive())
                    this.draw_actor(curr_actor, this.shapes.sphere, this.actor_type_material.get(curr_actor.get_type()), context, program_state);
                curr_actor_node = curr_actor_node.next;
            }

            // check for collisions between enemies and bullets
            let curr_enemy_node = this.actor_manager.actor_categories.get(Enemy.get_type_static()).head;
            
            while (curr_enemy_node != null) {

                let curr_enemy = curr_enemy_node.item;
                
                //if(this.hm) {
                    if (curr_enemy.is_alive() && curr_enemy.collided(this.player)) {
                        curr_enemy.kill();
                        if(this.lives==0)
                            this.alive = false;
                        else
                            this.lives--;
                    }
                    //}

                let curr_bullet_node = this.actor_manager.actor_categories.get(Bullet.get_type_static()).head;

                while (curr_bullet_node != null) {

                    let curr_bullet = curr_bullet_node.item;

                    if (curr_bullet.is_alive() && curr_enemy.is_alive() && curr_enemy.collided(curr_bullet)) {
                        curr_enemy.add_damage(25);

                        // add point if enemy was killed
                        if (!curr_enemy.is_alive()) {
                            this.kills++;
                        }
                        curr_bullet.kill();
                    }
                    curr_bullet_node = curr_bullet_node.next;
                }

                curr_enemy_node = curr_enemy_node.next;
            }

            if (this.actor_manager.get_num_loaded_actors() > 1000) {
                this.actor_manager.cull_dead_actors();
            }

            //game is paused
            if (this.paused) { 
                //display "game is paused" text
                let pause_L1 = Mat4.identity().times(Mat4.translation(-10,1,0.5)).times(Mat4.scale(1,1,1));
                let pause_L2 = Mat4.identity().times(Mat4.translation(-9.25,-1,0.5)).times(Mat4.scale(1,1,1));
                this.shapes.text.set_string("Game Is",context.context);
                this.shapes.text2.set_string("Paused",context.context);
                this.shapes.text.draw(context, program_state, pause_L1, this.materials.text_mat);
                this.shapes.text2.draw(context,program_state,pause_L2,this.materials.text_mat);
            }
            else {
                let rng = Math.random();

                // there is a .5% chance that a new "enemy" will spawn at a random height
                if (rng < 0.005) {
                    let size_speed_offset = Math.random();
                    let enemy = new Enemy(Math.floor(Math.random() * 10 - 5), 1 - size_speed_offset * .5, 5);
                    enemy.shape = this.shapes.bumpy_asteroid;
                    enemy.rot.x += Math.random();
                    enemy.rot.y += Math.random();
                    this.actor_manager.add_actor(enemy);
                }
                if (rng < 0.10) {
                    this.actor_manager.add_actor(new Star(Math.floor(Math.random() * 15 - 6), .02, 10))
                }
            }
            
            //display score
            let score_model = Mat4.identity().times(Mat4.translation(-19,-7,0)).times(Mat4.scale(0.5,0.5,0.5));
            this.shapes.text.set_string("Score: " + this.kills.toString(),context.context);
            this.shapes.text.draw(context,program_state,score_model,this.materials.text_mat);

            //if(this.hm) {
            //display number of lives:
            let lives_model = Mat4.identity().times(Mat4.translation(5,-7,0)).times(Mat4.scale(0.3,0.3,0.3));
            this.shapes.text.set_string("Lives: " + this.lives.toString(),context.context);
            this.shapes.text.draw(context,program_state,lives_model,this.materials.text_mat);
            //}
           
        }
        
        //player has not yet started their first game
        else if(this.alive) { 
            let new_game_L1 = Mat4.identity().times(Mat4.translation(-10,1,0)).times(Mat4.scale(1,1,1));
            let new_game_L2 = Mat4.identity().times(Mat4.translation(-10.75,-1,0)).times(Mat4.scale(1,1,1));
    
            this.shapes.text.set_string("Press g",context.context);
            this.shapes.text2.set_string("to Begin",context.context);
            this.shapes.text.draw(context, program_state, new_game_L1, this.materials.text_mat);
            this.shapes.text2.draw(context,program_state,new_game_L2,this.materials.text_mat);
        }

        //player dead
        else {
            let game_over_L1 = Mat4.identity().times(Mat4.translation(-11.5,1,0)).times(Mat4.scale(1,1,1));
            let game_over_L2= Mat4.identity().times(Mat4.translation(-9,-1,0)).times(Mat4.scale(0.5,0.5,0.5));
    
            this.shapes.text.set_string("Game Over",context.context);
            this.shapes.text2.set_string("Try Again",context.context);
            this.shapes.text.draw(context, program_state, game_over_L1, this.materials.text_mat);
            this.shapes.text2.draw(context,program_state, game_over_L2,this.materials.text_mat);
        }
    }
        
        
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = { color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40 };
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

