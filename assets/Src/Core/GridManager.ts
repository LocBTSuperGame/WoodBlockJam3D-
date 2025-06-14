import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridManager')
export class GridManager extends Component {
    static _instance: GridManager;
    static get instance() {
        return this._instance;
    }

    @property(Node)
    public board: Node = null!;

    @property(Prefab)
    public gridPrefab: Prefab = null!;

    @property
    private gridSizeCol: number = 9;

    @property
    private gridSizeRow: number = 9;

    @property
    private cellSize: number = 2.0;

    @property([Node])
    public listGrid: Node[] = [];
    public gridNodes: Node[][] = [];

    onLoad() {
        GridManager._instance = this;
        this.InitBoard();
        this.InitGrids();
    }

    InitBoard() {
        if (!this.board) return;
        this.board.setScale(this.gridSizeCol, 1, this.gridSizeRow);
    }

    InitGrids() {
        const halfWidth = (this.gridSizeCol - 1) * this.cellSize / 2;
        const halfDepth = (this.gridSizeRow - 1) * this.cellSize / 2;

        for (let row = 0; row < this.gridSizeRow; row++) {
            const rowArray: Node[] = [];

            for (let col = 0; col < this.gridSizeCol; col++) {
                const gridNode = instantiate(this.gridPrefab);
                const originalY = this.gridPrefab.data.position.y;

                const x = col * this.cellSize - halfWidth;
                const z = row * this.cellSize - halfDepth;

                gridNode.setPosition(new Vec3(x, originalY, z));
                this.node.addChild(gridNode);

                this.listGrid.push(gridNode);
                rowArray.push(gridNode);
            }

            this.gridNodes.push(rowArray);
        }

        console.log('✅ Created gridNodes:', this.gridNodes);
        console.log('✅ Created listGrid:', this.listGrid);
    }


    FindNodePosition(target: Node): { row: number, col: number } | null {
        for (let i = 0; i < this.gridNodes.length; i++) {
            for (let j = 0; j < this.gridNodes[i].length; j++) {
                if (this.gridNodes[i][j] === target) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    }
}
