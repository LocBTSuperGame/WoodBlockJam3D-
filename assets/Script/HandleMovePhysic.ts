import { _decorator, Component, Camera, input, Input, EventTouch, Node, Vec3 } from 'cc';
import { BoardManager } from './BoardManager';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('HandleMove')
export class HandleMovePhysic extends Component {
    @property({ type: Camera })
    mainCamera: Camera = null!;

    @property(BoardManager)
    boardManager: BoardManager = null!;

    private selectedBlock: Node | null = null;
    private blockComp: Block | null = null;
    private offset: Vec3 = new Vec3();
    private dragStartWorld: Vec3 = new Vec3();

    // Lưu row, col khi bắt đầu kéo để free khi drag block ra khỏi ô cũ
    private lastRow: number = -1;
    private lastCol: number = -1;

    onLoad() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        // Bắn ray chọn block
        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);
        const results = this.mainCamera.node.scene.getComponentsInChildren(Block);
        // Custom: Bạn có thể optimize cách raycast/select block nếu muốn
        let minDist = 99999;
        let hitBlock: Node | null = null;
        results.forEach(block => {
            const blockPos = block.node.worldPosition;
            const screenPos = this.mainCamera.worldToScreen(blockPos);
            const d = Vec3.distance(new Vec3(touchPos.x, touchPos.y, 0), screenPos);
            if (d < minDist && d < 80) { // 80px - phạm vi chọn
                minDist = d;
                hitBlock = block.node;
            }
        });
        if (hitBlock) {
            this.selectedBlock = hitBlock;
            this.blockComp = hitBlock.getComponent(Block);
            this.dragStartWorld = hitBlock.worldPosition.clone();

            // Xác định cell cũ
            if (this.blockComp) {
                const { row, col } = this.boardManager.worldPosToCell(this.dragStartWorld);
                this.lastRow = row;
                this.lastCol = col;
                // Khi bắt đầu drag, free ô cũ (nếu hợp lệ)
                for (const offset of this.blockComp.shape) {
                    this.boardManager.freeCell(row + offset.row, col + offset.col);
                }
            }
        }
    }

    onTouchMove(event: EventTouch) {
        if (!this.selectedBlock || !this.blockComp) return;
        // Tính world pos theo chuột (bắn ray giao với mặt phẳng Y=0)
        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);
        let t = -ray.o.y / ray.d.y;
        let pos = new Vec3(
            ray.o.x + ray.d.x * t,
            0,
            ray.o.z + ray.d.z * t
        );

        // Tìm cell gần nhất trên lưới
        const { row, col } = this.boardManager.worldPosToCell(pos);

        // Kiểm tra block có đặt vừa lên cell này không (không bị overlap block khác)
        if (this.boardManager.canPlaceBlockAt(this.blockComp.shape, row, col)) {
            // Snap block về center cell
            const centerPos = this.boardManager.cellToWorldPos(row, col);
            this.selectedBlock.setWorldPosition(centerPos);
            this.lastRow = row;
            this.lastCol = col;
        } else {
            // Nếu không đặt vừa, bạn có thể để block di chuyển theo chuột (tự do), hoặc snap về cell cũ, hoặc không update gì cả
            // Ở đây chọn: Không move nếu không hợp lệ (block sẽ dừng lại trước block khác)
        }
    }

    onTouchEnd(event: EventTouch) {
        if (!this.selectedBlock || !this.blockComp) return;
        // Khi nhả, block sẽ snap vào cell hợp lệ gần nhất (vị trí đang giữ)
        // Đánh dấu các cell mới là occupied
        if (this.lastRow !== -1 && this.lastCol !== -1) {
            this.boardManager.occupyCells(this.blockComp.shape, this.lastRow, this.lastCol);
        }
        // Reset
        this.selectedBlock = null;
        this.blockComp = null;
        this.lastRow = -1;
        this.lastCol = -1;
    }
}
