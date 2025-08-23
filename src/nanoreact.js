'use strict';

export const NanoReact = {}

NanoReact.Element = class {
    constructor(type, props = {}, children = []) {
        this.type = type;
        this.props = props;
        this.children = children;
        this.ref = null;
    }
    /**
     * Renders the element and its children.
     * @returns {HTMLElement}
     */
    async render() {
        this.ref = document.createElement(this.type);
        for (const [key, value] of Object.entries(this.props)) {
            if (key === 'ref') {
                if (typeof value === 'function') {
                    value(this.ref);
                } else {
                    throw new Error(`Invalid ref value for <${this.type}>. Expected function.`);
                }
            } else if (typeof value === 'function') { // ex. onClick property
                if (key.startsWith('on')) {
                    this.ref.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    this.ref[key] = value;
                }
            } else if (key === 'style') {
                if (typeof value === 'string') {
                    this.ref.style = value;
                } else if (typeof value === 'object') {
                    for (const [styleKey, styleValue] of Object.entries(value)) {
                        this.ref.style[styleKey] = styleValue;
                    }
                } else {
                    throw new Error(`Invalid style value for <${this.type}>. Expected string or object.`);
                }
            } else if (key === 'innerHTML') {
                if (typeof value === 'string') {
                    this.ref.innerHTML = value;
                } else {
                    throw new Error(`Invalid innerHTML value for <${this.type}>. Expected string.`);
                }
            } else {
                this.ref.setAttribute(key, value);
            }
        }
        for (const child of this.children) {
            let element;
            if (typeof child === 'string') {
                element = document.createTextNode(child);
            } else if (child instanceof NanoReact.Component || child instanceof NanoReact.Element) {
                element = await NanoReact.render(child);
            } else {
                throw new Error(`Invalid child type '${typeof child}'. Only strings or NanoReact.Element instances are allowed.`);
            }
            if (element) {
                this.ref.appendChild(element);
            }
        }
        return this.ref;
    }
}

NanoReact.Component = class extends NanoReact.Element {
    constructor() {
        super("Component");
        this.type = this.constructor.name;
        this.ref = null;
    }
    /**
     * Renders the component.
     * @returns {NanoReact.Element}
     */
    async render() {
        throw new Error('Render method must be implemented in subclass');
    }
    async componentDidMount() {}
};

/**
 * Renders an Element or a Component
 * @param {NanoReact.Element | NanoReact.Component} element - The element to render.
 */
NanoReact.render = async function (element) {
    if (element instanceof NanoReact.Component) {
        const comp = element;
        element = await comp.render();
        if (!element) {
            throw new Error(`Component '${comp.type}' rendered '${element}'. Ensure the render method returns a valid NanoReact.Element.`);
        }
        if (!(element instanceof NanoReact.Element)) {
            throw new Error(`Component '${comp.type}' must return a NanoReact.Element. Use createElement to create elements.`);
        }
        const ref = await element.render();
        comp.ref = ref;
        element.ref = ref;
        await comp.componentDidMount();
        return ref;
    }
    if (!(element instanceof NanoReact.Element)) {
        throw new Error('Invalid element type. Use createElement to create elements.');
    }
    const ref = await element.render();
    element.ref = ref;
    return ref;
};

/**
 * Creates a new Element.
 * @param {string|function|NanoReact.Component} type - The type of the element (tag name or component).
 * @param {object} [props={}] - The properties to set on the element.
 * @param {Array} [children=[]] - The children of the element.
 * @returns {NanoReact.Element|NanoReact.Component}
 */
NanoReact.createElement = function (type, props = {}, ...children) {
    // Normalize children to an array
    children = [].concat(...children);

    if (type instanceof NanoReact.Element) {
        // Already an element, no need to create a new one
        return type;
    }
    if (typeof type === 'string') {
        return new NanoReact.Element(type, props, children);
    }
    // 'class' also have typeof 'function'
    if (typeof type === 'function') {
        if (type.prototype instanceof NanoReact.Component) {
            // If it's a class extending NanoReact.Component
            const componentInstance = new type(props);
            return componentInstance;
        }
        try {
            // If it's a function, we assume it returns an element
            return type(props, ...children);
        } catch (error) {
            if (error instanceof TypeError && error.message.endsWith("cannot be invoked without 'new'")) {
                throw new Error(`Class '${type.name}' is not a valid NanoReact component. It should extend NanoReact.Component`);
            }
            throw error;
        }
    }
    throw new Error(`Invalid element type: ${typeof type}`);
};

export const h = NanoReact.createElement;
