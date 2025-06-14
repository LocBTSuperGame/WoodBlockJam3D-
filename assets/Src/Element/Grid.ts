import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Grid')
export class Grid extends Component {
    @property
    special: boolean = false;
    @property(Node)
    nodeOwn: Node = null;

    @property(Node)
    specialNode: Node = null;
    public isOccupied = false;
    start() {
        if (this.special) {
            this.scheduleOnce(() => {
                this.nodeOwn = this.specialNode;
            }, 0.2)
        }
    }
    CheckOccupied(): boolean {
        return this.nodeOwn !== null;
    }
    SetNodeOwn(node: Node) {
        this.nodeOwn = node;
    }
    ReBackValue() {
        return this.nodeOwn = null;
    }
}


