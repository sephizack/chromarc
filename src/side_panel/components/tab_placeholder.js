'use strict';
import { NanoReact, h } from '../../nanoreact.js';


export class TabPlaceholder extends NanoReact.Component {

    static instance = null;

    constructor({ draggedObject, onDrop }) {
        super();
        this.draggedObject = draggedObject;
        this.onDrop = onDrop;
    }

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

    static getDraggedObject() {
        return TabPlaceholder.instance?.draggedObject;
    }

    static setOnDrop(onDrop) {
        TabPlaceholder.instance.onDrop = onDrop;
    }

    static insertBefore(target) {
        target.parentNode.insertBefore(TabPlaceholder.instance.ref, target);
    }

    static insertAfter(target) {
        target.parentNode.insertBefore(TabPlaceholder.instance.ref, target.nextSibling);
    }

    static insertDraggedObject() {
        TabPlaceholder.instance.ref.parentNode.insertBefore(TabPlaceholder.instance.draggedObject.ref, TabPlaceholder.instance.ref);
        TabPlaceholder.remove();
    }

    static remove() {
        TabPlaceholder.instance.ref.parentNode?.removeChild(TabPlaceholder.instance.ref);
    }
}
