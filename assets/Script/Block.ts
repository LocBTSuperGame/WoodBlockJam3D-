import { _decorator, Component, Node, MeshRenderer, Material, resources, Enum, Vec3, math } from 'cc';
const { ccclass, property } = _decorator;

enum ShapeType {
    '1x1' = 0,
    '1x2' = 1,
    '2x2' = 2,
}
const SHAPE_TYPE_LABELS = ['1x1', '1x2', '2x2'];
const SHAPES: Record<string, { row: number, col: number }[]> = {
    '1x1': [ { row: 0, col: 0 } ],
    '1x2': [ { row: 0, col: 0 }, { row: 0, col: 1 } ],
    '2x2': [
        { row: 0, col: 0 }, { row: 0, col: 1 },
        { row: 1, col: 0 }, { row: 1, col: 1 }
    ],
};

@ccclass('Block')
export class Block extends Component {
    @property({ type: Enum(ShapeType) })
    public shapeType: ShapeType = ShapeType['1x1'];

    public shape: { row: number, col: number }[] = [];

    @property
    public materialIndex: number = 1; // Chọn số 1-7 trên Inspector

    @property
    public limitUpDown: boolean = false;     // Chỉ cho phép kéo lên/xuống
    @property
    public limitLeftRight: boolean = false;  // Chỉ cho phép kéo trái/phải

    public gridRow: number = -1;
    public gridCol: number = -1;
    public currentCells: { row: number, col: number }[] = [];

    onLoad() {
        const shapeName = SHAPE_TYPE_LABELS[this.shapeType];
        this.shape = SHAPES[shapeName];

        if (this.materialIndex >= 1 && this.materialIndex <= 7) {
            this.setMaterialForCubes(this.materialIndex);
        } else {
            this.checkMaterialIndex();
        }
    }

    /** Lấy ra các cell sẽ chiếm nếu đặt tại (baseRow, baseCol) */
    public getOccupiedCells(baseRow: number, baseCol: number) {
        return this.shape.map(offset => ({
            row: baseRow + offset.row,
            col: baseCol + offset.col,
        }));
    }

    /** Cập nhật vị trí cell hiện tại mà block chiếm (nên gọi khi snap/move) */
    public updateCurrentCells(row: number, col: number) {
        this.gridRow = row;
        this.gridCol = col;
        this.currentCells = this.getOccupiedCells(row, col);
    }

    /** Kiểm tra block có thể đặt tại (row, col) không */
    public canPlaceAt(baseRow: number, baseCol: number, board: any): boolean {
        for (const cell of this.getOccupiedCells(baseRow, baseCol)) {
            if (!board.isCellFree(cell.row, cell.col)) return false;
        }
        return true;
    }

    /** Đánh dấu chiếm các cell trên lưới */
    public snapToGrid(row: number, col: number, board: any) {
        for (const cell of this.getOccupiedCells(row, col)) {
            board.occupyCell(cell.row, cell.col);
        }
        this.updateCurrentCells(row, col);
    }

    /** Hàm chính: tính limit trượt block tối đa theo 4 hướng */
    public getGroupLimit(board: any) {
        if (!this.currentCells || this.currentCells.length === 0) return { left: 0, right: 0, up: 0, down: 0 };
        const numRows = board.gridSize;
        const numCols = board.gridSize;
        const positions = this.currentCells;
        let left = 0, right = 0, up = 0, down = 0;

        // Trái
        while (true) {
            if (positions.some(pos => pos.col - (left + 1) < 0)) break;
            if (positions.some(pos => {
                const r = pos.row, c = pos.col - (left + 1);
                return !positions.some(p => p.row === r && p.col === c) && board.gridOccupied[r][c];
            })) break;
            left++;
        }
        // Phải
        while (true) {
            if (positions.some(pos => pos.col + (right + 1) >= numCols)) break;
            if (positions.some(pos => {
                const r = pos.row, c = pos.col + (right + 1);
                return !positions.some(p => p.row === r && p.col === c) && board.gridOccupied[r][c];
            })) break;
            right++;
        }
        // Lên
        while (true) {
            if (positions.some(pos => pos.row - (up + 1) < 0)) break;
            if (positions.some(pos => {
                const r = pos.row - (up + 1), c = pos.col;
                return !positions.some(p => p.row === r && p.col === c) && board.gridOccupied[r][c];
            })) break;
            up++;
        }
        // Xuống
        while (true) {
            if (positions.some(pos => pos.row + (down + 1) >= numRows)) break;
            if (positions.some(pos => {
                const r = pos.row + (down + 1), c = pos.col;
                return !positions.some(p => p.row === r && p.col === c) && board.gridOccupied[r][c];
            })) break;
            down++;
        }

        // Áp dụng flag limit chỉ trượt 1 trục
        if (this.limitUpDown) { left = 0; right = 0; }
        if (this.limitLeftRight) { up = 0; down = 0; }

        return { left, right, up, down };
    }

    /** Chuyển limit sang worldPos min/max để clamp khi kéo */
    public getWorldLimitPosition(limit, board: any) {
        if (!this.currentCells || this.currentCells.length === 0) return { min: new Vec3(), max: new Vec3() };
        // Lấy row/col hiện tại của mảnh block gốc (giả sử mảnh [0])
        const ref = this.currentCells[0];
        // Tính min/max col/row hợp lệ
        const minCol = ref.col - limit.left;
        const maxCol = ref.col + limit.right;
        const minRow = ref.row - limit.up;
        const maxRow = ref.row + limit.down;
        // Chuyển sang worldPos
        const minPos = board.cellToWorldPos(minRow, minCol);
        const maxPos = board.cellToWorldPos(maxRow, maxCol);
        return { min: minPos, max: maxPos };
    }

    setMaterialForCubes(index: number) {
        const matName = `BlockMaterial-00${index}`;
        resources.load(`Material/${matName}`, Material, (err, mat) => {
            if (err || !mat) {
                console.warn(`Không tìm thấy material: ${matName}`);
                return;
            }
            this.node.children.forEach(child => {
                if (child.name.startsWith('Cube')) {
                    const meshRenderer = child.getComponent(MeshRenderer);
                    if (meshRenderer) {
                        meshRenderer.setMaterial(mat, 0);
                    }
                }
            });
        });
    }

    checkMaterialIndex() {
        for (const child of this.node.children) {
            if (child.name.startsWith('Cube')) {
                const meshRenderer = child.getComponent(MeshRenderer);
                if (meshRenderer) {
                    const mat = meshRenderer.getMaterial(0);
                    if (mat) {
                        const matName = mat.name;
                        const match = matName.match(/BlockMaterial-00(\d+)/);
                        if (match) {
                            this.materialIndex = parseInt(match[1]);
                            console.log(`Block "${this.node.name}" dùng material index: ${this.materialIndex}`);
                        } else {
                            console.log(`Block "${this.node.name}" material không đúng định dạng: ${matName}`);
                        }
                        break;
                    }
                }
            }
        }
    }
}


// import { _decorator, Component, Node, MeshRenderer, Material, resources, Enum, Vec3 } from 'cc';
// const { ccclass, property } = _decorator;

// // Enum khai báo trực tiếp để dùng với @property
// enum ShapeType {
//     '1x1' = 0,
//     '1x2' = 1,
//     '2x2' = 2,
// }
// const SHAPE_TYPE_LABELS = ['1x1', '1x2', '2x2'];
// const SHAPES: Record<string, { row: number, col: number }[]> = {
//     '1x1': [ { row: 0, col: 0 } ],
//     '1x2': [ { row: 0, col: 0 }, { row: 0, col: 1 } ],
//     '2x2': [
//         { row: 0, col: 0 }, { row: 0, col: 1 },
//         { row: 1, col: 0 }, { row: 1, col: 1 }
//     ],
// };

// @ccclass('Block')
// export class Block extends Component {
//     @property({ type: Enum(ShapeType) })
//     public shapeType: ShapeType = ShapeType['1x1'];

//     public shape: { row: number, col: number }[] = [];

//     @property
//     public materialIndex: number = 1; // Chọn số 1-7 trên Inspector

//     /** Vị trí lưới (row, col) khi block được snap vào lưới */
//     public gridRow: number = -1;
//     public gridCol: number = -1;

//     onLoad() {
//         // Lấy label string theo enum value
//         const shapeName = SHAPE_TYPE_LABELS[this.shapeType];
//         this.shape = SHAPES[shapeName];

//         if (this.materialIndex >= 1 && this.materialIndex <= 7) {
//             this.setMaterialForCubes(this.materialIndex);
//         } else {
//             this.checkMaterialIndex();
//         }
//     }

//     /** Trả về mảng các cell mà block chiếm nếu đặt tại (baseRow, baseCol) */
//     public getOccupiedCells(baseRow: number, baseCol: number) {
//         return this.shape.map(offset => ({
//             row: baseRow + offset.row,
//             col: baseCol + offset.col,
//         }));
//     }

//     /** Kiểm tra block có thể đặt tại (baseRow, baseCol) không */
//     public canPlaceAt(baseRow: number, baseCol: number, board: any): boolean {
//         for (const cell of this.getOccupiedCells(baseRow, baseCol)) {
//             if (!board.isCellFree(cell.row, cell.col)) return false;
//         }
//         return true;
//     }

//     /** Đặt block vào lưới tại (row, col), cập nhật thuộc tính */
//     public snapToGrid(row: number, col: number, board: any) {
//         // Đánh dấu chiếm các cell
//         for (const cell of this.getOccupiedCells(row, col)) {
//             board.occupyCell(cell.row, cell.col);
//         }
//         this.gridRow = row;
//         this.gridCol = col;
//     }

//     setMaterialForCubes(index: number) {
//         const matName = `BlockMaterial-00${index}`;
//         resources.load(`Material/${matName}`, Material, (err, mat) => {
//             if (err || !mat) {
//                 console.warn(`Không tìm thấy material: ${matName}`);
//                 return;
//             }
//             this.node.children.forEach(child => {
//                 // Tùy bạn đặt tên child là gì, mặc định là "Cube"
//                 if (child.name.startsWith('Cube')) {
//                     const meshRenderer = child.getComponent(MeshRenderer);
//                     if (meshRenderer) {
//                         meshRenderer.setMaterial(mat, 0);
//                     }
//                 }
//             });
//         });
//     }

//     checkMaterialIndex() {
//         // Tìm Cube con đầu tiên có MeshRenderer và material
//         for (const child of this.node.children) {
//             if (child.name.startsWith('Cube')) {
//                 const meshRenderer = child.getComponent(MeshRenderer);
//                 if (meshRenderer) {
//                     const mat = meshRenderer.getMaterial(0);
//                     if (mat) {
//                         const matName = mat.name;
//                         const match = matName.match(/BlockMaterial-00(\d+)/);
//                         if (match) {
//                             this.materialIndex = parseInt(match[1]);
//                             console.log(`Block "${this.node.name}" dùng material index: ${this.materialIndex}`);
//                         } else {
//                             console.log(`Block "${this.node.name}" material không đúng định dạng: ${matName}`);
//                         }
//                         break;
//                     }
//                 }
//             }
//         }
//     }
// }

