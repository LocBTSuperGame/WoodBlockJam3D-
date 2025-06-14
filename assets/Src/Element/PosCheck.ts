import { _decorator, Component, Node, Vec3, instantiate } from 'cc';
import { GridManager } from '../Core/GridManager';
import { Grid } from '../Element/Grid';
const { ccclass, property } = _decorator;

@ccclass('PosCheck')
export class PosCheck extends Component {
    @property
    public rowOwn: number = 0;
    @property
    public colOwn: number = 0;
    @property(Node)
    public nodeCloset = null;

    // @property([Node])
    // listTargetNodeCloset: Node[] = [];

    // public listPosPassenger: Node[] = [];
    start() {
        this.InitDataPos();

    }


    InitDataPos() {
        let frameCloset = this.FindNodeCloset();

        let data = GridManager.instance.FindNodePosition(frameCloset);
        // console.log(data)
        if (data == null) return;
        // console.log('daco data moi')
        if (GridManager.instance.gridNodes[this.rowOwn][this.colOwn].getComponent(Grid).nodeOwn == this.node.parent) {
            this.ReBackValue();
        }
        this.rowOwn = data.row;
        this.colOwn = data.col;
        GridManager.instance.gridNodes[this.rowOwn][this.colOwn].getComponent(Grid).SetNodeOwn(this.node.parent)
    }
    ReBackValue() {
        GridManager.instance.gridNodes[this.rowOwn][this.colOwn].getComponent(Grid).ReBackValue();
    }
    public FindNodeCloset(): Node {
        let nodeCloset: Node = null;
        let minDistance = 2.1;
        const originNode = this.node.getWorldPosition();
        GridManager.instance.listGrid.forEach(node => {
            const nodePos = node.getWorldPosition();
            // originNode.z = 0;
            // nodePos.z = 0;
            const distance = Vec3.distance(originNode, nodePos);

            // console.log('pos ',originNode)
            // console.log('...',node.name);
            // console.log('nodecheck ',nodePos)
            // console.log(distance)
            if (distance < minDistance && (!node.getComponent(Grid).CheckOccupied() || node.getComponent(Grid).nodeOwn == this.node.parent)) {
                minDistance = distance;
                nodeCloset = node;
                // console.log(node.name)
            }
        })
        this.nodeCloset = nodeCloset;
        return nodeCloset;
    }
}


