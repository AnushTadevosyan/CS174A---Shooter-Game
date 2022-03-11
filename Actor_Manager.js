class Node {
    constructor(item, next = null, prev = null) {
        this.next = next;
        this.prev = prev;
        this.item = item;
    }
}

class Linked_List {
    constructor() {
        this.head = null;
        this.tail = null;

        // quick access to any arbitrary node
        this.node_set = new Set();
    }

    is_empty() { return this.head == null && this.tail == null; }

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

        this.node_set.add(n);

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

        this.node_set.add(n);

        return n;
    }

    // quick delete node by reference
    delete(node) {
        if (this.node_set.has(node)) {

            if (node.next) {
                node.next.prev = node.prev;
            }

            if (node.prev) {
                node.prev.next = node.next
            }

            if (this.head == node) {
                this.head = node.next;
            }

            if (this.tail == node) {
                this.tail = node.prev;
            }

            this.node_set.delete(node);

        }
    }

    pop_back() {
        let n = this.tail;

        this.delete(n);

        return n;
    }

    pop_front() {
        let n = this.head;

        this.delete(n);

        return n;
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

    // runs update function on each actor
    update_actor_list(t, dt) {
        let curr = this.actor_list.head;

        while (curr != null) {

            let actor = curr.item;

            actor.update(t, dt);

            curr = curr.next;
        }
    }

    cull_dead_actors() {
        let curr = this.actor_list.head;

        while (curr != null) {

            let actor = curr.item;

            if (!actor.is_alive()) {
                this.actor_list.delete(this.actor_to_list_node.get(actor));
                this.actor_to_list_node.delete(actor);
                this.actor_categories.get(actor.get_type()).delete(this.actor_to_category_node.get(actor));
                this.actor_to_category_node.delete(actor);
            }

            curr = curr.next;
        }
    }

    get_num_loaded_actors() {
        return this.actor_list.node_set.size;
    }
}

export { Actor_Manager }
