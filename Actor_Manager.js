class Node {
    constructor(item, next = null, prev = null) {
        this.next = next;
        this.prev = prev;
        this.item = item;
    }

    // delete this node from the list
    delete() {
        if (this.next) {
            this.next.prev = this.prev;
        }
        if (this.prev) {
            this.prev.next = this.next;
        }
    }
}

class Linked_List {
    constructor() {
        this.head = null;
        this.tail = null;
    }

    is_empty() { return this.head == null && this.tail == null; }

    // add item to front of list
    push_front(item) {

        if (this.head) {
            let n = new Node(item);
            this.head.prev = n;
            n.next = this.head;
            this.head = n;
        }
        else {
            this.head = new Node(item);
            this.tail = new Node(item);
        }
    }

    // add item to front of list and return ref to node
    push_front(item) {

        let n = new Node(item);

        if (this.head) {
            this.head.prev = n;
            n.next = this.head;
            this.head = n;
        }
        else {
            this.head = n;
            this.tail = this.head;
        }

        return n;
    }

    // add item to back of list return ref to node
    push_back(item) {

        let n = new Node(item);

        if (this.tail) {
            this.tail.next = n;
            n.prev = this.tail;
            this.tail = n;
        }
        else {
            this.head = n;
            this.tail = this.head;
        }

        return n;
    }

    // returns an array of all items in the list
    to_array() {
        let result = new Array();

        while (!this.is_empty()) {
            result.push(this.head);
            this.head.delete();
        }

        return result;
    }
}

class Actor_Manager {
    constructor() {
        this.actor_list = new Linked_List();
        this.actor_categories = new Map();
        this.actor_to_category_node = new Map();
        this.actor_to_list_node = new Map();
    }

    add_category(category) {
        let type_list = this.actor_categories.get(category);

        if (!type_list) {
            this.actor_categories.set(category, new Linked_List());
        }
    }

    add_actor(actor) {
        let type_list = this.actor_categories.get(actor.get_type());

        if (!type_list) {
            this.actor_categories.set(actor.get_type(), new Linked_List());
            type_list = this.actor_categories.get(actor.get_type());
        }

        let list_node = this.actor_list.push_back(actor);

        this.actor_to_list_node.set(actor, list_node);

        let cat_node = type_list.push_back(actor);

        this.actor_to_category_node.set(actor, cat_node);
    }

    // runs update function on each actor and culls dead actors from the list
    update_actor_list(t, dt) {
        let curr = this.actor_list.head;

        while (curr != null) {

            let actor = curr.item;

            // this actor is dead; remove it!
            if (!actor.is_alive()) {
                this.actor_to_list_node.get(actor).delete();
                this.actor_to_list_node.delete(actor);
                this.actor_to_category_node.get(actor).delete();
                this.actor_to_category_node.delete(actor);
            }

            actor.update(t, dt);

            curr = curr.next;
        }
    }
}

export { Actor_Manager }
