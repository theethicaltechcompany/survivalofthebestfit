import {bluePersonTexture} from '../../controllers/common/textures.js';
import {pixiApp, personContainer, deskContainer, eventEmitter} from '../../controllers/game/gameSetup.js';
import {uv2px} from '../../controllers/common/utils.js';

class PersonController {
    constructor(parent, office) {
        this.parent = parent;
        this.office = office;
        this.desk = null;
    }

    setDesk(desk) {
        this.desk = desk;
    }

    isSeated() {
        return this.desk != null;
    }
}

function onPersonDragStart(event) {
    if (this.controller.isSeated()) {
        // ToDo: replace this with person leaving a desk. Remove from desk object, and decrease office fullness counter
        this.dragging = false;
        return;
    }
    this.data = event.data;
    this.origX = this.x;
    this.origY = this.y;
    this.alpha = 0.5;
    this.dragging = true;
}

// BUG: double click outside the app on text and click on character and drag it around. This can cause a lot of issues.
// BUG: sometimes if people are overlapping, it thinks the bottom one was dropped and it pops the guy back to the original position

function onPersonDragEnd() {
    if (this.dragging) {
        const hitDesk = pixiApp.renderer.plugins.interaction.hitTest(new PIXI.Point(this.x, this.y), deskContainer);
        if (hitDesk == null || hitDesk.controller.isTaken()) {
            this.x = this.origX;
            this.y = this.origY;
        } else {
            this.x = hitDesk.x+hitDesk.height/2;
            this.y = hitDesk.y+hitDesk.width/2;
            hitDesk.controller.setPerson(this);
            this.controller.setDesk(hitDesk);
            sendAssigned();
        }
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
    }
}

function onPersonDragMove() {
    if (this.dragging) {
        // this.x += this.data.originalEvent.movementX/officeContainer.scale.x;
        // this.y += this.data.originalEvent.movementY/officeContainer.scale.y;

        const newPosition = this.data.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
    }
}

function sendAssigned() {
    eventEmitter.emit('assigned-desk', {});
}

function createPerson(x, y, office) {
    const person = new PIXI.Sprite(bluePersonTexture);
    person.controller = new PersonController(person, office);
    person.interactive = true;
    person.buttonMode = true;
    person.type = 'person';
    person.anchor.set(0.5);
    person.scale.set(0.15);
    person.x = uv2px(x, 'w');
    person.y = uv2px(y, 'h');
    person
        .on('pointerdown', onPersonDragStart)
        .on('pointerup', onPersonDragEnd)
        .on('pointerupoutside', onPersonDragEnd)
        .on('pointermove', onPersonDragMove);

    personContainer.addChild(person);
    return person;
}

export {createPerson};