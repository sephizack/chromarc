'use strict';
import { NanoReact, h } from '../../nanoreact.js';


export class TabPlaceholder extends NanoReact.Component {

    static instance = null;

    /**
     * Creates a new TabPlaceholder instance.
     * @param {object} props - Component props.
     * @param {object} props.draggedObject - The object being dragged.
     * @param {Function} props.onDrop - Drop event handler.
     */
    constructor({ draggedObject, onDrop }) {
        super();
        this.draggedObject = draggedObject;
        this.onDrop = onDrop;
    }

    /**
     * Renders the placeholder element.
     * @returns {NanoReact.Element} The placeholder element.
     */
    render() {
        // Create and insert placeholder
        return h('li',
            {
                className: 'tab-placeholder',
                style: {
                    height: this.draggedObject.ref.offsetHeight + 'px',
                    margin: this.draggedObject.ref.style.margin
                },
                ondragover: (e) => {
                    e.preventDefault();
                },
                ondrop: (e) => this.onDrop(e),
            }
        );
    }

    /**
     * Creates a placeholder for a dragged object.
     * @param {object} draggedObject - The object being dragged.
     * @param {Function} onDrop - Drop event handler.
     */
    static async createFor(draggedObject, onDrop) {
        if (TabPlaceholder.instance) {
            TabPlaceholder.remove();
        }
        TabPlaceholder.instance = h(TabPlaceholder, {
            draggedObject: draggedObject,
            onDrop: onDrop
        });
        draggedObject.ref.parentNode.insertBefore(await NanoReact.render(TabPlaceholder.instance), draggedObject.ref.nextSibling);
        // Hide the dragged tab visually
        setTimeout(() => {
            draggedObject.ref.style.display = 'none';
        }, 0);
    }

    /**
     * Gets the currently dragged object.
     * @returns {object|undefined} The dragged object or undefined if none exists.
     */
    static getDraggedObject() {
        return TabPlaceholder.instance?.draggedObject;
    }

    /**
     * Sets the drop handler for the placeholder.
     * @param {Function} onDrop - The drop event handler.
     */
    static setOnDrop(onDrop) {
        TabPlaceholder.instance.onDrop = onDrop;
    }

    /**
     * Inserts the placeholder before the target element.
     * @param {HTMLElement} target - The target element.
     */
    static insertBefore(target) {
        target.parentNode.insertBefore(TabPlaceholder.instance.ref, target);
    }

    /**
     * Inserts the placeholder after the target element.
     * @param {HTMLElement} target - The target element.
     */
    static insertAfter(target) {
        target.parentNode.insertBefore(TabPlaceholder.instance.ref, target.nextSibling);
    }

    /**
     * Inserts the dragged object at the placeholder position and removes the placeholder.
     */
    static insertDraggedObject() {
        TabPlaceholder.instance.ref.parentNode.insertBefore(TabPlaceholder.instance.draggedObject.ref, TabPlaceholder.instance.ref);
        TabPlaceholder.remove();
    }

    /**
     * Removes the placeholder from the DOM.
     */
    static remove() {
        TabPlaceholder.instance.ref.parentNode?.removeChild(TabPlaceholder.instance.ref);
    }
}
