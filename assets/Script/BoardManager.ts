import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BoardManager')
export class BoardManager extends Component {
    @property({ type: Prefab })
    gridPrefab: Prefab = null!;         // Prefab cho từng ô lưới

    @property
    public gridSize: number = 9;        // Số hàng/cột (mặc định lưới vuông)

    @property
    public gridSpacing: number = 2.0;   // Khoảng cách giữa các ô (cell size)

    @property
    public gridStart: Vec3 = new Vec3(8.5, 0, 8.5); // Góc trên-trái bàn cờ (tùy setup scene)

    @property(Node)
    gridRoot: Node = null!;             // Node cha để chứa các node cell

    public gridCenters: Vec3[][] = [];              // Lưu vị trí center từng cell
    public gridOccupied: boolean[][] = [];          // Trạng thái từng ô (false=free, true=đầy)

    onLoad() {
        this.generateBoard();
    }

    /** Tạo lưới (gọi khi bắt đầu game) */
    generateBoard() {
        this.gridCenters = [];
        this.gridOccupied = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.gridCenters[row] = [];
            this.gridOccupied[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                let x = this.gridStart.x - col * this.gridSpacing;
                let y = this.gridStart.y;
                let z = this.gridStart.z - row * this.gridSpacing;
                this.gridCenters[row][col] = new Vec3(x, y, z);
                this.gridOccupied[row][col] = false;

                // Khởi tạo node cell và gán vào gridRoot
                if (this.gridPrefab && this.gridRoot) {
                    const gridNode = instantiate(this.gridPrefab);
                    gridNode.setPosition(x, y, z);
                    gridNode.parent = this.gridRoot;
                }
            }
        }
    }

    /** Kiểm tra 1 ô có hợp lệ và còn trống không */
    public isCellFree(row: number, col: number): boolean {
        return this.isInBoard(row, col) && !this.gridOccupied[row][col];
    }

    /** Đánh dấu 1 ô đã bị chiếm */
    public occupyCell(row: number, col: number) {
        if (this.isInBoard(row, col)) this.gridOccupied[row][col] = true;
    }
    /** Giải phóng 1 ô */
    public freeCell(row: number, col: number) {
        if (this.isInBoard(row, col)) this.gridOccupied[row][col] = false;
    }

    /** Kiểm tra 1 cặp row,col có nằm trong lưới không */
    public isInBoard(row: number, col: number): boolean {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }

    /** Chuyển world position sang chỉ số cell gần nhất */
    public worldPosToCell(pos: Vec3): { row: number, col: number } {
        let col = Math.round((this.gridStart.x - pos.x) / this.gridSpacing);
        let row = Math.round((this.gridStart.z - pos.z) / this.gridSpacing);
        return { row, col };
    }

    /** Chuyển chỉ số cell sang world position (center) */
    public cellToWorldPos(row: number, col: number): Vec3 {
        if (!this.isInBoard(row, col)) return this.gridStart.clone();
        return this.gridCenters[row][col].clone();
    }

    /** Kiểm tra block với shape có thể đặt vừa lên lưới tại (row, col) không */
    public canPlaceBlockAt(shape: { row: number, col: number }[], baseRow: number, baseCol: number): boolean {
        for (const offset of shape) {
            const row = baseRow + offset.row;
            const col = baseCol + offset.col;
            if (!this.isCellFree(row, col)) return false;
        }
        return true;
    }

    /** Đánh dấu các cell đã bị chiếm bởi block với shape tại (baseRow, baseCol) */
    public occupyCells(shape: { row: number, col: number }[], baseRow: number, baseCol: number) {
        for (const offset of shape) {
            const row = baseRow + offset.row;
            const col = baseCol + offset.col;
            this.occupyCell(row, col);
        }
    }
}
