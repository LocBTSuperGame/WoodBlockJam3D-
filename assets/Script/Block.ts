import { _decorator, Component, Node, Enum, Vec3, MeshRenderer, Material, resources } from 'cc';
import { BoardManager } from './BoardManager';
const { ccclass, property } = _decorator;

enum ShapeType {
    '1x1' = 0,
    '1x2' = 1,
    '2x2' = 2,
}
const SHAPE_TYPE_LABELS = ['1x1', '1x2', '2x2'];
const SHAPES: Record<string, { x: number, z: number }[]> = {
    '1x1': [{ x: 0, z: 0 }],
    '1x2': [{ x: 0, z: 0 }, { x: 0, z: 1 }],
    '2x2': [{ x: 0, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 0 }, { x: 1, z: 1 }],
};

@ccclass('Block')
export class Block extends Component {
    @property({ type: Enum(ShapeType) })
    public shapeType: ShapeType = ShapeType['1x1'];
    @property
    public materialIndex: number = 1;

    @property
    public limitUpDown: boolean = false;     // Chỉ cho phép kéo lên/xuống
    @property
    public limitLeftRight: boolean = false;  // Chỉ cho phép kéo trái/phải

    @property
    public gridRow: number = 0;
    @property
    public gridCol: number = 0;
    public shape: { x: number, z: number }[] = [];

    @property
    public isHide: boolean = false;

    onLoad() {
        const shapeName = SHAPE_TYPE_LABELS[this.shapeType];
        this.shape = SHAPES[shapeName];

        if (this.materialIndex >= 1 && this.materialIndex <= 7) {
            this.setMaterialForCubes(this.materialIndex);
        }

        this.gridCol = (8.5 - this.node.getPosition().x) * 0.5;
        this.gridRow = (8.5 - this.node.getPosition().z) * 0.5;
    }
    // Danh sách các cell mà block chiếm tại vị trí hiện tại
    public getOccupiedCells(row: number, col: number) {
        return this.shape.map(offset => ({
            row: row + offset.x,   // x ~ row
            col: col + offset.z,   // z ~ col
        }));
    }

    // Kiểm tra có thể move sang hướng (dr, dc) không
    public canMove(dir: { dr: number, dc: number }, board: any): boolean {
        // Nếu có limit, không cho di chuyển hướng cấm
        if (this.limitUpDown && dir.dc !== 0) return false;
        if (this.limitLeftRight && dir.dr !== 0) return false;
        const newCells = this.getOccupiedCells(this.gridRow + dir.dr, this.gridCol + dir.dc);
        for (const cell of newCells) {
            if (!board.isInBoard(cell.row, cell.col)) return false;
            if (board.isWallAt && board.isWallAt(cell.row, cell.col)) return false;
            // Chỉ được overlap cell chính mình khi đang move, không được trùng block khác
            if (!this.getOccupiedCells(this.gridRow, this.gridCol).some(c => c.row === cell.row && c.col === cell.col) && board.gridOccupied[cell.row][cell.col]) {
                return false;
            }
        }
        return true;
    }

    // Thực hiện di chuyển block trên board
    public move(dir: { dr: number, dc: number }, board: any) {
        // Free cell cũ
        for (const cell of this.getOccupiedCells(this.gridRow, this.gridCol)) {
            board.freeCell(cell.row, cell.col);
        }
        // Cập nhật vị trí mới
        this.gridRow += dir.dr;
        this.gridCol += dir.dc;
        // Occupy cell mới
        for (const cell of this.getOccupiedCells(this.gridRow, this.gridCol)) {
            board.occupyCell(cell.row, cell.col);
        }
        // Snap worldPos về đúng vị trí mới
        const newCenter = board.cellToWorldPos(this.gridRow, this.gridCol);
        this.node.setWorldPosition(newCenter.x, 0, newCenter.z);
    }

    // Snap lại block về vị trí center của (row, col)
    public snapToGrid(row: number, col: number, board: any) {
        // Free các ô cũ nếu có
        const oldCells = this.getOccupiedCells(this.gridRow, this.gridCol);
        for (const cell of oldCells) {
            board.freeCell(cell.row, cell.col);
        }

        // Cập nhật vị trí mới
        this.gridRow = row;
        this.gridCol = col;

        // Occupy các ô mới
        const newCells = this.getOccupiedCells(row, col);
        for (const cell of newCells) {
            board.occupyCell(cell.row, cell.col);
        }

        // Cập nhật world position
        const pos = board.cellToWorldPos(row, col);
        this.node.setWorldPosition(pos.x, 0, pos.z);
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

    public hide(board: BoardManager) {
        // Ẩn node 
        this.node.active = false;
        this.isHide = true;

        // Free tất cả cell mà block đang chiếm
        const cells = this.getOccupiedCells(this.gridRow, this.gridCol);
        cells.forEach(cell => {
            board.freeCell(cell.row, cell.col);
        });
    }
}
