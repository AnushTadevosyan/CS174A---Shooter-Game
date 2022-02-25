class Actor {

    constructor(coordinates, rotations, size, hitbox_size = size) {
        this.coords = coordinates;
        this.rot = rotations;
        this.size = size;
        this.collider_radius = hitbox_size;
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
}

// what the player actually shoots
class Bullet extends Actor {
    constructor(coordinates, size, speed, angle) {
        super(coordinates, ) 
    }
};
