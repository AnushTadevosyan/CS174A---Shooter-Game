import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4
} = tiny;

function tuple3(x, y, z) { return {x: x, y: y, z: z}}

class Actor {

    constructor(coordinates, rotations, size, hitbox_size = size, health = 1, shape = null, material = null) {
        this.coords = coordinates;
        this.rot = rotations;
        this.size = size;
        this.collider_radius = hitbox_size;
        this.alive = true;
        this.health = health;
        this.shape = shape
        this.material = material
    }

    // returns coordinates of this actor's origin (in middle)
    get_coordinates() { return this.coords; }

    get_rotations() { return this.rot; }

    get_rotation_matrix() { return Mat4.rotation(this.rot.x, 1, 0, 0).times(Mat4.rotation(this.rot.y, 0, 1, 0)).times(Mat4.rotation(this.rot.z, 0, 0, 1)); }

    // override this function in subclasses
    update(t, dt) { }

    // true if this actor collided with another actor based on hitbox
    // this implementation uses spheres because it's easy
    // to check and rotation doesn't matter
    collided(other_actor) {
        let other_center = other_actor.get_coordinates();
        let this_center = this.get_coordinates();

        let x_dist = other_center.x - this_center.x;
        let y_dist = other_center.y - this_center.y;
        let z_dist = other_center.z - this_center.z;

        // distance formula: d = sqrt(dx^2 + dy^2 + dz^2)
        // square both sides to avoid sqrt call
        let d = x_dist * x_dist + y_dist * y_dist + z_dist * z_dist;
        let radius_distance = this.get_radius() + other_actor.get_radius();

        return d < (radius_distance * radius_distance);
    }

    // stub this for now
    get_hitbox_size() { return undefined }

    get_radius() { return this.collider_radius; }

    static get_type_static() { return "None"; }

    // wrapper to call get_type_static from class instances
    get_type() { return this.constructor.get_type_static(); }

    kill() { this.alive = false; }

    is_alive() { return this.alive; }

    add_damage(damage_amount) {
        if (this.health - damage_amount <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }
};

// what the player actually shoots
class Bullet extends Actor {
    constructor(coordinates, size, speed, angle) {
        super(coordinates, tuple3(0, 0, 0), size);
        this.speed = speed;
        this.angle = angle;

        // delete bullet based on how long it's been on screen
        // maybe replace with detecting when off screen?
        this.age = 0; 
                      
    }

    update(t, dt) {
        this.coords.x += dt * this.speed * Math.cos(this.angle);
        this.coords.y += dt * this.speed * Math.sin(this.angle);

        this.age += dt;

        if (this.age > 10) {
            this.kill();
        }
    }

    static get_type_static() { return "Bullet"; }
};

class Enemy extends Actor {
    constructor(height, size, speed) {
        super(tuple3(15, height, 0), tuple3(0, 0, 0), size);
        this.speed = -1 * speed;
    }

    update(t, dt) {
        this.coords.x += dt * this.speed;

        if (this.coords.x < -25) this.kill();

        this.rot.z += dt;
    }

    static get_type_static() { return "Enemy"; }
}

class Player extends Actor {
    constructor(controls) {
        super(tuple3(-15,-1,0), tuple3(0,0,0), 1);
        this.controls = controls;
        this.speed = 10;
    }

    move_up(amount = 1) { 
        let new_height = this.coords.y + amount;
        if (new_height < 7.5)
            this.coords.y = new_height;
        else this.coords.y = 7.5;
    }

    move_down(amount = 1) {
        let new_height = this.coords.y - amount;
        if (new_height > -7.5)
            this.coords.y = new_height;
        else this.coords.y = -7.5;
    }

    move_right(amount = 1) { this.coords.x += amount; }

    move_left(amount = 1) { this.coords.x -= amount; }

    update(t, dt) {

        let move_amount = dt * this.speed;

        // clamp player movement
        move_amount = (move_amount < 7.5) ? move_amount : 0;

        this.rot.x = 0;
        this.rot.z = 0;

        let x_rot_amount = .2;
        let z_rot_amount = .1;

        if (this.controls["up"]) {
            this.move_up(move_amount)
            this.rot.x -= x_rot_amount;
            this.rot.z += z_rot_amount;
        }
        if (this.controls["down"]) {
            this.move_down(move_amount);
            this.rot.x += x_rot_amount;
            this.rot.z -= z_rot_amount;
        }
    }

    static get_type_static() { return "Player"; }
}

class Star extends Actor {

    constructor(height, size, speed) {
        super(tuple3(15, height, -2), tuple3(0, 0, 0), size);
        this.speed = -1 * speed;
    }

    update(t, dt) {
        this.coords.x += dt * this.speed;

        if (this.coords.x < -25) this.kill();
    }

    static get_type_static() { return "Star"; }
}

export { Bullet, Enemy, Player, Star }
