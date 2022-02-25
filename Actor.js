import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix
} = tiny;

class Actor {

    constructor(coordinates, rotations, size, hitbox_size = size) {
        this.coords = coordinates;
        this.rot = rotations;
        this.size = size;
        this.collider_radius = hitbox_size;
        this.alive = true;
    }

    // returns coordinates of this actor's origin (in middle)
    get_coordinates() { return this.coords; }

    get_rotations() { return this.rot; }

    // override this function in subclasses
    update(t, dt) { }

    // true if this actor collided with another actor based on hitbox
    // this implementation uses spheres because it's easy
    // to check and rotation doesn't matter
    collided(other_actor) {
        // let's assume these are Vec3 objects for now...
        let other_center = other_actor.get_coordinates();
        let this_center = this.get_coordinates();

        let x_dist = other_center.x - this_center.x;
        let y_dist = other_center.y - this_center.y;
        let z_dist = other_center.z - this_center.z;

        // distance formula: d = sqrt(dx^2 + dy^2 + dz^2)
        let d = Math.sqrt(x_dist * x_dist + y_dist * y_dist + z_dist * z_dist);

        return d < (this.get_radius() + other_actor.get_radius());
    }

    // stub this for now
    get_hitbox_size() { return undefined }

    get_radius() { return this.collider_radius; }

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
        super(coordinates, new vec3(0, 0, 0), size);
        this.speed = speed;
        this.angle = angle;
        this.start = new vec3(coordinates.x, coordinates.y, coordinates.z);
    }

    update(t, dt) {
        this.start.x += dt * this.speed * Math.cos(this.angle);
        this.start.y += dt * this.speed * Math.sin(this.angle);
    }
};

class Enemy extends Actor {
    constructor(y_position, size, angle) {
        super(coordinates, new vec3(0, y_position, 0), size);
        this.speed = -1 * speed;
        this.angle = angle;
        this.start = new vec3(coordinates.x, coordinates.y, coordinates.z);
    }

    update(t, dt) {
        this.start.x += dt * this.speed;
        this.start.y += dt * this.speed;
    }
}
