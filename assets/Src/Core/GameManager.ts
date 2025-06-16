import { _decorator, Component, Node, Prefab } from 'cc';
import { resources } from 'cc';
import { SoundManager } from './SoundManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    static _instance: GameManager;
    static get instance() {
        return this._instance;
    }
    public checkFirst: boolean = false;
    public checkCanTouch: boolean = true;
    onLoad() {
        GameManager._instance = this;
        SoundManager.instance.playBGM("bgm_theme");
        GameManager.preloadAllMaterials();
    }
    static preloadAllMaterials() {
        resources.preloadDir('Material', () => {
            console.log('Preloaded all block materials.');
        });
    }
}


