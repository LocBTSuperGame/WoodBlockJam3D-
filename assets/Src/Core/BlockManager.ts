import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BlockManager')
export class BlockManager extends Component {
    @property([Node])
    listBlock: Node[] = [];
    public totalBlocks: number = 0;
    @property
    public blockUsedCount: number = 0;
    @property
    public blockUsedCountMax: number = 4;
    static _instance: BlockManager;
    static get instance() {
        return this._instance;
    }
    onLoad() {
        BlockManager._instance = this;
        this.Init()
    }
    Init() {
        this.node.children.forEach(child => {
            this.listBlock.push(child);
            this.totalBlocks++;
        })
    }
 
    RemoveBlockInList(block: Node) {
        let index = this.listBlock.indexOf(block);
        if (index > -1) {
            this.listBlock.splice(index, 1);
        }
        if(this.blockUsedCount <= this.blockUsedCountMax) {
            this.blockUsedCount++;
            console.log("Block used count: " + this.blockUsedCount);
        }
    }
    CheckNoMoreBlock(): boolean {
        return this.listBlock.length == 0;
    }
}


