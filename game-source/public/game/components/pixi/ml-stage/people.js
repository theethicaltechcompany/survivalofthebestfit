import {mlLabStageContainer, eventEmitter} from '~/public/game/controllers/game/gameSetup.js';
import {cvCollection} from '~/public/game/assets/text/cvCollection.js';
import {uv2px} from '~/public/game/controllers/common/utils.js';
import {EVENTS, ML_PEOPLE_CONTAINER} from '~/public/game/controllers/constants';
import MLPerson from '~/public/game/components/pixi/ml-stage/person';
import PeopleTalkManager from '~/public/game/components/interface/ml/people-talk-manager/people-talk-manager';
import {dataModule} from '~/public/game/controllers/machine-learning/dataModule.js';

export default class {
    constructor() {
        this.container = new PIXI.Container();
        this.container.name = ML_PEOPLE_CONTAINER;
        this.numOfPeople = Math.floor(uv2px(0.85, 'w')/70) * 2;
        this.mlStartIndex = dataModule.getLastIndex() || 0;
        this.mlLastIndex = dataModule.getLastIndex() || 0;
        this.peopleLine = [];
        this.mlLabRejected = [];

        this.personXoffset = 70;
        this.peopleTalkManager = new PeopleTalkManager({parent: mlLabStageContainer, stage: 'ml'});
        this._createPeople();
        eventEmitter.on(EVENTS.RESIZE, this._draw.bind(this));
        
        mlLabStageContainer.addChild(this.container);
        this._draw();
        this.container.x = uv2px(0.25, 'w');


    }

    _draw() {
        this.container.y = uv2px(0.96, 'h');
    }

    _createPeople() {
        for (let i = 0; i < this.numOfPeople; i++) {
            this._addNewPerson();
        }
    }

    _addNewPerson() {
        let currentX = (this.mlLastIndex-this.mlStartIndex);
        const person = new MLPerson({
            parent: this.container,
            x: currentX*this.personXoffset,
            personData: cvCollection.cvData[this.mlLastIndex],
            id: this.mlLastIndex,
        });
        person.addToPixi();
        this.peopleLine.push(person);
        dataModule.recordLastIndex(this.mlLastIndex++);
    }

    recalculateCandidateAverage() {
        return dataModule.getAverageScore({indexRange: Array(this.mlStartIndex, this.mlLastIndex)});
    }

    createTween() {
        const tween = PIXI.tweenManager.createTween(this.container);
        tween.from({x: this.container.x}).to({x: this.container.x-this.personXoffset});
        tween.delay = 200;
        tween.time = 600;
        return tween;
    }

    recalibrateTween(tween) {
        tween.from({x: this.container.x}).to({x: this.container.x-this.personXoffset});
    }

    getFirstPerson() {
        return this.peopleLine.length > 0 ? this.peopleLine[0] : undefined;
    }

    getCount() {
        return this.peopleLine.length;
    }

    removeFirstPerson(status) {
        this.peopleLine[0].removeFromLine({decision: status});

        if (status == 'rejected') {
            this.mlLabRejected.push(this.peopleLine[0].id)
        }

        this.peopleLine = this.peopleLine.slice(1);
        this._addNewPerson();
    }

    chooseCandidateToInspect() {
        //this function chooses a blue, well qualified candiate that was rejected for the CEO to inspect
        let getAverage = (array) => array.reduce((a, b) => a + parseInt(b), 0) / array.length;
          
        let result = this.mlLabRejected.find( personId => cvCollection.cvData[personId].color == "blue" );
        
        // if for some reason the game accepts everyone, we don't want it to crash so return 10 in worst case
        return result || this.mlLabRejected[this.mlLabRejected.length - 1] || 10;
    }
}
