import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('BoardManager')
export class BoardManager extends Component {
    @property({ type: Prefab })
    gridPrefab: Prefab = null!;
    @property
    public gridSize: number = 9;
    @property
    public gridSpacing: number = 2.0;
    @property
    public gridStart: Vec3 = new Vec3(8.5, 0, 8.5);
    @property(Node)
    gridRoot: Node = null!;
    @property(Node)
    public blocksContainer: Node | null = null;

    public gridCenters: Vec3[][] = [];
    public gridOccupied: boolean[][] = [];
    public wallOccupied: boolean[][] = [];

    onLoad() {
        this.generateBoard();
    }

    start() {
        this.initAllBlocks();
    }

    private initAllBlocks() {
        if (!this.blocksContainer) {
            console.error('Blocks container is not set!');
            return;
        }

        // Lấy tất cả Block component từ các con của blocksContainer
        const blocks = this.blocksContainer.getComponentsInChildren(Block);

        // Init từng block
        blocks.forEach(block => {
            if (block && block.isValid) {
                this.initBlockOnBoard(block);
            }
        });
    }

    public generateBoard() {
        this.gridCenters = [];
        this.gridOccupied = [];
        this.wallOccupied = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.gridCenters[row] = [];
            this.gridOccupied[row] = [];
            this.wallOccupied[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                let x = this.gridStart.x - col * this.gridSpacing;
                let y = this.gridStart.y;
                let z = this.gridStart.z - row * this.gridSpacing;
                this.gridCenters[row][col] = new Vec3(x, y, z);
                this.gridOccupied[row][col] = false;
                this.wallOccupied[row][col] = false;
                if (this.gridPrefab && this.gridRoot) {
                    const gridNode = instantiate(this.gridPrefab);
                    gridNode.setPosition(x, y, z);
                    gridNode.parent = this.gridRoot;
                }
            }
        }
    }

    public isInBoard(row: number, col: number): boolean {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }
    public occupyCell(row: number, col: number) {
        if (this.isInBoard(row, col)) this.gridOccupied[row][col] = true;
    }
    public freeCell(row: number, col: number) {
        if (this.isInBoard(row, col)) this.gridOccupied[row][col] = false;
    }
    public cellToWorldPos(row: number, col: number): Vec3 {
        if (!this.isInBoard(row, col)) return this.gridStart.clone();
        return this.gridCenters[row][col].clone();
    }
    public worldPosToCell(pos: Vec3): { row: number, col: number } {
        let col = Math.round((this.gridStart.x - pos.x) / this.gridSpacing);
        let row = Math.round((this.gridStart.z - pos.z) / this.gridSpacing);
        return { row, col };
    }
    // Đánh dấu ô là wall (nếu muốn, không bắt buộc)
    public setWall(row: number, col: number, isWall = true) {
        if (this.isInBoard(row, col)) this.wallOccupied[row][col] = isWall;
    }
    public isWallAt(row: number, col: number): boolean {
        return this.isInBoard(row, col) && !!this.wallOccupied[row][col];
    }

    public initBlockOnBoard(block: Block) {
        // Kiểm tra và set vị trí ban đầu cho block
        const pos = this.cellToWorldPos(block.gridRow, block.gridCol);
        block.node.setWorldPosition(pos.x, 0, pos.z);

        // Đánh dấu các ô đã chiếm
        const cells = block.getOccupiedCells(block.gridRow, block.gridCol);
        for (const cell of cells) {
            this.occupyCell(cell.row, cell.col);
        }
    }
}
