import { defs, tiny } from './examples/common.js';
import { Bullet, Enemy, Player, Star } from './Actor.js';
import { Actor_Manager } from './Actor_Manager.js';
import { Text_Line } from './examples/text-demo.js';
import { Shape_From_File } from "./examples/obj-file-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Main extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.audio = new Audio("assets/musicc.mp3")

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            text: new Text_Line(15),
            text2: new Text_Line(15),
            text3: new Text_Line(20),
            bumpy_asteroid: new Shape_From_File("assets/bumpy_aster.obj"),
            round_asteroid: new Shape_From_File("assets/round_asteroid.obj"),
            spaceship: new Shape_From_File("assets/rocket.obj"),
            bullet: new Shape_From_File("assets/bullet.obj")

            //text3: new Text_Line(15)
        };

        this.model_transform = Mat4.identity().times(Mat4.translation(-15, -1, 0));

        //this.blaster = new defs.Subdivision_Sphere(4);

        // *** Materials
        this.materials = {
            text_mat: new Material(new defs.Textured_Phong(1),
                { ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png") }),
            space_ship: new Material(new defs.Textured_Phong(1),
                { ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/spaceship_Metallic.png") })
        };

        this.initial_camera_location = Mat4.translation(5, 0, -20).times(Mat4.rotation(0, 0, 0, -90));

        this.start = false;
        this.init_game_systems();

        this.actor_type_material = new Map();
        this.actor_type_material.set(
            Player.get_type_static(), this.materials.space_ship
        );
        this.actor_type_material.set(
            Enemy.get_type_static(), new Material(new defs.Phong_Shader(),
                { ambient: .4, diffusivity: .6, color: hex_color("#3d3635") })
        );
        this.actor_type_material.set(
            Bullet.get_type_static(), new Material(new defs.Phong_Shader(),
                { ambient: .8, diffusivity: .6, color: hex_color("#d4af37") })
        );
        this.actor_type_material.set(
            Star.get_type_static(), new Material(new defs.Phong_Shader(),
                { ambient: 1, diffusivity: .6, color: hex_color("#FFFFFF") })
        );

        this.controls = new Map();
        this.controls["up"] = false;
        this.controls["down"] = false;
        this.bullet_limit_timer = 0;
    }

    make_control_panel() {
        this.key_triggered_button("New Game", ["g"], () => this.reset());
        //this.key_triggered_button("Hard Mode/Endless Mode", ["h"], () => {this.hm = !this.hm});
        this.key_triggered_button("Pause/Unpause", ["u"], () => { this.paused = !this.paused });
        this.key_triggered_button("Move Up", ["ArrowUp"], () => { this.controls["up"] = true; }, undefined, () => { this.controls["up"] = false; });
        this.key_triggered_button("Move Down", ["ArrowDown"], () => { this.controls["down"] = true; }, undefined, () => { this.controls["down"] = false; });
        this.key_triggered_button("Shoot", ["j"], () => { this.shoot_bullet(0) });
        this.key_triggered_button("Toggle Difficulty", ["t"], () => { this.difficulty = (this.difficulty + 1) % 3 });
        this.key_triggered_button("Music On/Off", ["m"], () => { this.play_audio = !this.play_audio });

        // debug
        // this.key_triggered_button("Spawn Enemy", ["b"], () => { this.actor_manager.add_actor(new Enemy(Math.floor(Math.random() * 15 - 3), .3, 5)); });
        //this.key_triggered_button("Toggle Screenlock", ["q"], () => {this.lock_screen = !this.lock_screen});
    }

    my_mouse_down(e, pos, context, program_state) {

        if (this.paused) return;

        //HARD CODED BASED ON SCREEN DIMENSIONS: (-20<x<9, -7.5<y<7.5)
        //IF SCREEN DIMENSIONS CHANGE, THIS NEEDS TO BE CHANGED
        let mouse_x = (pos[0] * 15) - 5.5;
        let mouse_y = (pos[1] * 7.5);

        let x_diff = (mouse_x - this.player.coords.x);
        let y_diff = (mouse_y - this.player.coords.y);
        let bullet_angle = Math.atan(y_diff / x_diff);

        if (x_diff > 0)
            this.shoot_bullet(bullet_angle);
    }

    reset() {
        this.start = true;
        this.init_game_systems();
    }

    init_game_systems() {
        //refresh everything
        //this.hm = false;
        this.alive = true;
        this.paused = false;
        this.lock_screen = true;
        this.play_audio = false;
        this.kills = 0;
        this.lives = 3;
        this.difficulty = 0;
        this.difficulty_str = "Easy";
        this.enemy_speed = 5;
        this.level = 1;
        this.enemy_spawnrate = .005;
        this.player = new Player(this.controls);
        this.actor_manager = new Actor_Manager();
        this.actor_manager.add_actor(this.player);
        this.actor_manager.add_category(Enemy.get_type_static());
        this.actor_manager.add_category(Bullet.get_type_static());

        this.player.shape = this.shapes.spaceship
        this.player.material = this.materials.space_ship
    }

    shoot_bullet(angle) {

        if (this.paused || this.bullet_limit_timer > 0) return;

        this.bullet_limit_timer = 0.25; // player can fire new bullet every 1/4 second
        let c = this.player.get_coordinates();
        let b = new Bullet({ x: c.x, y: c.y, z: c.z }, .2, 8, angle);
        b.shape = this.shapes.bullet
        b.rot.z = angle;
        this.actor_manager.add_actor(b);
    }

    draw_actor(actor, shape, mat, context, program_state) {
        let coords = actor.get_coordinates();
        let s = actor.size
        if (actor.shape)
            shape = actor.shape;
        if (actor.material)
            mat = actor.material
        let model_transform = Mat4.translation(coords.x, coords.y, coords.z).times(actor.get_rotation_matrix()).times(Mat4.scale(s, s, s));
        shape.draw(context, program_state, model_transform, mat);
    }

    display(context, program_state) {

        if (this.play_audio) {
            this.audio.play();
        } else {
            this.audio.pause();
        }

        if (!context.scratchpad.controls) {
            //this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

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

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        switch (this.difficulty) {
            case 0:
                this.difficulty_str = "Easy";
                this.enemy_speed = 5;
                break;
            case 1:
                this.difficulty_str = "Medium";
                this.enemy_speed = 10;
                break;
            case 2:
                this.difficulty_str = "Hard";
                this.enemy_speed = 15;
                break;
        }

        //Level calculations (Every 10 kills move on to next level)
        //every level increases enemy spawn rate
        this.level = Math.floor((this.kills / 10) + 1);
        this.enemy_spawnrate = (this.level * .005);

        //player has begun the game
        if (this.alive && this.start) {

            if (this.lock_screen) {
                program_state.set_camera(Mat4.translation(5, 0, -20).times(Mat4.rotation(0, 0, 0, -90)));
            }

            // draw actors that are alive
            let curr_actor_node = this.actor_manager.actor_list.head;

            while (curr_actor_node != null) {
                let curr_actor = curr_actor_node.item;
                if (curr_actor.is_alive())
                    this.draw_actor(curr_actor, this.shapes.sphere, this.actor_type_material.get(curr_actor.get_type()), context, program_state);
                curr_actor_node = curr_actor_node.next;
            }

            // garbage collection
            if (this.actor_manager.get_num_loaded_actors() > 1000) {
                this.actor_manager.cull_dead_actors();
            }

            //game is paused
            if (this.paused) {
                //display "game is paused" text
                let pause_L1 = Mat4.identity().times(Mat4.translation(-10, 1, 3)).times(Mat4.scale(1, 1, 1));
                let pause_L2 = Mat4.identity().times(Mat4.translation(-9.25, -1, 3)).times(Mat4.scale(1, 1, 1));
                this.shapes.text.set_string("Game Is", context.context);
                this.shapes.text2.set_string("Paused", context.context);
                this.shapes.text.draw(context, program_state, pause_L1, this.materials.text_mat);
                this.shapes.text2.draw(context, program_state, pause_L2, this.materials.text_mat);
            }
            else {
                this.actor_manager.update_actor_list(t, dt);
                this.bullet_limit_timer -= dt;

                // check for collisions between enemies and bullets
                let curr_enemy_node = this.actor_manager.actor_categories.get(Enemy.get_type_static()).head;

                while (curr_enemy_node != null) {

                    let curr_enemy = curr_enemy_node.item;

                    //if(this.hm) {
                    if (curr_enemy.is_alive() && this.player.collided(curr_enemy)) {
                        curr_enemy.kill();
                        if (this.lives == 1)
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

                let rng = Math.random();

                // there is a .5% chance (at level 1) that a new "enemy" will spawn at a random height
                if (rng < this.enemy_spawnrate) {
                    let size_speed_offset = Math.random();
                    let enemy = new Enemy(Math.floor(Math.random() * 10 - 5), 1 - size_speed_offset * .5, this.enemy_speed);
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
            let score_model = Mat4.identity().times(Mat4.translation(-15, -6, 3)).times(Mat4.scale(0.3, 0.3, 0.3));
            this.shapes.text.set_string("Score: " + this.kills.toString(), context.context);
            this.shapes.text.draw(context, program_state, score_model, this.materials.text_mat);

            //if(this.hm) {
            //display number of lives:
            let lives_model = Mat4.identity().times(Mat4.translation(5, -7, 0)).times(Mat4.scale(0.3, 0.3, 0.3));
            this.shapes.text.set_string("Lives: " + this.lives.toString(), context.context);
            this.shapes.text.draw(context, program_state, lives_model, this.materials.text_mat);
            //}

            //display difficulty
            let difficulty_text_model = Mat4.identity().times(Mat4.translation(-9, -7, 0)).times(Mat4.scale(0.3, 0.3, 0.3));
            this.shapes.text3.set_string("Difficulty: " + this.difficulty_str, context.context);
            this.shapes.text3.draw(context, program_state, difficulty_text_model, this.materials.text_mat);

            //display level
            let level_text_model = Mat4.identity().times(Mat4.translation(-7, 7, 0)).times(Mat4.scale(0.3, 0.3, 0.3));
            this.shapes.text3.set_string("Level " + this.level.toString(), context.context);
            this.shapes.text3.draw(context, program_state, level_text_model, this.materials.text_mat);
        }

        //player has not yet started their first game
        else if (this.alive) {
            let new_game_L1 = Mat4.identity().times(Mat4.translation(-10, 1, 0)).times(Mat4.scale(1, 1, 1));
            let new_game_L2 = Mat4.identity().times(Mat4.translation(-10.75, -1, 0)).times(Mat4.scale(1, 1, 1));

            this.shapes.text.set_string("Press g", context.context);
            this.shapes.text2.set_string("to Begin", context.context);
            this.shapes.text.draw(context, program_state, new_game_L1, this.materials.text_mat);
            this.shapes.text2.draw(context, program_state, new_game_L2, this.materials.text_mat);
        }

        //player dead
        else {
            let game_over_L1 = Mat4.identity().times(Mat4.translation(-11.5, 1, 0)).times(Mat4.scale(1, 1, 1));
            let game_over_L2 = Mat4.identity().times(Mat4.translation(-9, -1, 0)).times(Mat4.scale(0.5, 0.5, 0.5));

            this.shapes.text.set_string("Game Over", context.context);
            this.shapes.text2.set_string("Try Again", context.context);
            this.shapes.text.draw(context, program_state, game_over_L1, this.materials.text_mat);
            this.shapes.text2.draw(context, program_state, game_over_L2, this.materials.text_mat);
        }
    }
}