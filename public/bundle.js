
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Navbar.svelte generated by Svelte v3.8.0 */

    const file = "src/Navbar.svelte";

    function create_fragment(ctx) {
    	var div, h1;

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Player Scoreboard";
    			add_location(h1, file, 1, 2, 34);
    			attr(div, "class", "navbar bg-primary");
    			add_location(div, file, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/Player.svelte generated by Svelte v3.8.0 */

    const file$1 = "src/Player.svelte";

    // (26:25) {:else}
    function create_else_block(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("+");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (26:6) {#if showControls}
    function create_if_block_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("-");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (30:2) {#if showControls}
    function create_if_block(ctx) {
    	var button0, t1, button1, t3, input, dispose;

    	return {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "+1";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "-1";
    			t3 = space();
    			input = element("input");
    			attr(button0, "class", "btn");
    			add_location(button0, file$1, 30, 4, 550);
    			attr(button1, "class", "btn btn-dark");
    			add_location(button1, file$1, 31, 4, 606);
    			attr(input, "type", "number");
    			add_location(input, file$1, 32, 4, 674);

    			dispose = [
    				listen(button0, "click", ctx.addPoint),
    				listen(button1, "click", ctx.removePoint),
    				listen(input, "input", ctx.input_input_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, button0, anchor);
    			insert(target, t1, anchor);
    			insert(target, button1, anchor);
    			insert(target, t3, anchor);
    			insert(target, input, anchor);

    			input.value = ctx.points;
    		},

    		p: function update(changed, ctx) {
    			if (changed.points) input.value = ctx.points;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button0);
    				detach(t1);
    				detach(button1);
    				detach(t3);
    				detach(input);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div, h1, t0, t1, button, t2, h3, t3, t4, t5, dispose;

    	function select_block_type(ctx) {
    		if (ctx.showControls) return create_if_block_1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.showControls) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(ctx.name);
    			t1 = space();
    			button = element("button");
    			if_block0.c();
    			t2 = space();
    			h3 = element("h3");
    			t3 = text("Points: ");
    			t4 = text(ctx.points);
    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr(button, "class", "btn btn-sm");
    			add_location(button, file$1, 24, 4, 382);
    			attr(h1, "class", "svelte-n9s305");
    			add_location(h1, file$1, 22, 2, 362);
    			attr(h3, "class", "svelte-n9s305");
    			add_location(h3, file$1, 28, 2, 499);
    			attr(div, "class", "card");
    			add_location(div, file$1, 21, 0, 341);
    			dispose = listen(button, "click", ctx.toggleControls);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    			append(h1, t0);
    			append(h1, t1);
    			append(h1, button);
    			if_block0.m(button, null);
    			append(div, t2);
    			append(div, h3);
    			append(h3, t3);
    			append(h3, t4);
    			append(div, t5);
    			if (if_block1) if_block1.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.name) {
    				set_data(t0, ctx.name);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, null);
    				}
    			}

    			if (changed.points) {
    				set_data(t4, ctx.points);
    			}

    			if (ctx.showControls) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block0.d();
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name = "John Doe", points = 100 } = $$props;

      let showControls = false;

      const addPoint = () => { const $$result = (points += 1); $$invalidate('points', points); return $$result; };
      const removePoint = () => { const $$result = (points -= 1); $$invalidate('points', points); return $$result; };
      const toggleControls = () => { const $$result = (showControls = !showControls); $$invalidate('showControls', showControls); return $$result; };

    	const writable_props = ['name', 'points'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		points = to_number(this.value);
    		$$invalidate('points', points);
    	}

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('points' in $$props) $$invalidate('points', points = $$props.points);
    	};

    	return {
    		name,
    		points,
    		showControls,
    		addPoint,
    		removePoint,
    		toggleControls,
    		input_input_handler
    	};
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["name", "points"]);
    	}

    	get name() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get points() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set points(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AddPlayer.svelte generated by Svelte v3.8.0 */

    const file$2 = "src/AddPlayer.svelte";

    function create_fragment$2(ctx) {
    	var form, input0, t0, input1, t1, input2, dispose;

    	return {
    		c: function create() {
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			input2 = element("input");
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "Player Name");
    			add_location(input0, file$2, 23, 2, 358);
    			attr(input1, "type", "number");
    			attr(input1, "placeholder", "Player Points");
    			add_location(input1, file$2, 24, 2, 433);
    			attr(input2, "type", "submit");
    			attr(input2, "class", "btn btn-primary");
    			input2.value = "Add Player";
    			add_location(input2, file$2, 25, 2, 514);
    			attr(form, "class", "grid-3");
    			add_location(form, file$2, 22, 0, 313);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(form, "submit", ctx.onSubmit)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, input0);

    			input0.value = ctx.player.name;

    			append(form, t0);
    			append(form, input1);

    			input1.value = ctx.player.points;

    			append(form, t1);
    			append(form, input2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.player && (input0.value !== ctx.player.name)) input0.value = ctx.player.name;
    			if (changed.player) input1.value = ctx.player.points;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

      let player = {
        name: "",
        points: 0
      };

      const onSubmit = e => {
        e.preventDefault();

        dispatch("addplayer", player);

        $$invalidate('player', player = {
          name: "",
          points: 0
        });
      };

    	function input0_input_handler() {
    		player.name = this.value;
    		$$invalidate('player', player);
    	}

    	function input1_input_handler() {
    		player.points = to_number(this.value);
    		$$invalidate('player', player);
    	}

    	return {
    		player,
    		onSubmit,
    		input0_input_handler,
    		input1_input_handler
    	};
    }

    class AddPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.8.0 */

    const file$3 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.player = list[i];
    	return child_ctx;
    }

    // (37:2) {:else}
    function create_else_block$1(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.players;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.players) {
    				each_value = ctx.players;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (35:2) {#if players.length === 0}
    function create_if_block$1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No Players";
    			add_location(p, file$3, 35, 4, 571);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (38:4) {#each players as player}
    function create_each_block(ctx) {
    	var current;

    	var player = new Player({
    		props: { name: ctx.player.name, points: ctx.player.points },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			player.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(player, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var player_changes = {};
    			if (changed.players) player_changes.name = ctx.player.name;
    			if (changed.players) player_changes.points = ctx.player.points;
    			player.$set(player_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(player, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var t0, div, t1, current_block_type_index, if_block, current;

    	var navbar = new Navbar({ $$inline: true });

    	var addplayer = new AddPlayer({ $$inline: true });
    	addplayer.$on("addplayer", ctx.addPlayer);

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.players.length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			navbar.$$.fragment.c();
    			t0 = space();
    			div = element("div");
    			addplayer.$$.fragment.c();
    			t1 = space();
    			if_block.c();
    			attr(div, "class", "container");
    			add_location(div, file$3, 32, 0, 473);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div, anchor);
    			mount_component(addplayer, div, null);
    			append(div, t1);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);

    			transition_in(addplayer.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(addplayer.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div);
    			}

    			destroy_component(addplayer);

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let players = [
        {
          name: "John Doe",
          points: 100
        },
        {
          name: "Timmy Turner",
          points: 100
        },
        {
          name: "Jack Boo",
          points: 100
        }
      ];

      const addPlayer = e => {
        const newPlayer = e.detail;

        $$invalidate('players', players = [...players, newPlayer]);
      };

    	return { players, addPlayer };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
