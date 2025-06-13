import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridCell')
export class GridCell extends Component {
    public nodeOwn: Node | null = null;

    public isOccupied(): boolean {
        return !!this.nodeOwn;
    }
    public setNodeOwn(node: Node) {
        this.nodeOwn = node;
    }
    public clearNodeOwn() {
        this.nodeOwn = null;
    }
}
