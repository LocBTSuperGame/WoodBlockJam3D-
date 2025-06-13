import { _decorator, Component, Camera, input, Input, EventTouch, Vec3, math, Node, PhysicsSystem } from 'cc';
import { BoardManager } from './BoardManager';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('HandleMove')
export class HandleMove extends Component {
    @property({ type: Camera })
    mainCamera: Camera = null!;

    @property(BoardManager)
    boardManager: BoardManager = null!;

    // Kéo/thả block
    private selectedBlock: Block | null = null;
    private offset: Vec3 = new Vec3(); // offset giữa tâm block và vị trí touch trên block
    private baseRow: number = -1;      // vị trí row/col gốc khi bắt đầu kéo
    private baseCol: number = -1;

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

    // 1. Chọn block khi bắt đầu kéo
    onTouchStart(event: EventTouch) {
        const touchPos = event.getLocation();
        // Raycast để lấy node block (ưu tiên dùng PhysicsSystem nếu block có collider, hoặc dùng code dưới nếu không)
        let hitBlock: Block | null = null;
        let minDist = Infinity;

        // Có thể cải tiến bằng raycast 3D nếu block nhiều tầng, ở đây dùng cách quét block gần vị trí touch nhất (trên scene)
        for (const blockNode of this.node.children) {
            if (!blockNode.active) continue;
            const block = blockNode.getComponent(Block);
            if (block) {
                // Lấy worldPos tâm block
                const blockPos = blockNode.getWorldPosition();
                // Chuyển blockPos về screen pos để so sánh
                const screenPos = this.mainCamera.worldToScreen(blockPos);
                const dist = Vec3.distance(new Vec3(touchPos.x, touchPos.y), new Vec3(screenPos.x, screenPos.y));
                if (dist < 80 && dist < minDist) { // vùng click 80px, tùy chỉnh
                    hitBlock = block;
                    minDist = dist;
                }
            }
        }
        if (!hitBlock) return; // không chọn được block nào

        this.selectedBlock = hitBlock;

        // Tính offset giữa vị trí block và điểm touch (trên mặt phẳng XZ)
        const blockPos = this.selectedBlock.node.getWorldPosition();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);
        let t = -ray.o.y / ray.d.y;
        let hitPoint = new Vec3(ray.o.x + ray.d.x * t, 0, ray.o.z + ray.d.z * t);
        Vec3.subtract(this.offset, blockPos, hitPoint);

        // Tìm vị trí lưới gốc của block để tính limit
        // (nếu block chưa nằm lưới thì dùng worldPosToCell)
        const { row, col } = this.boardManager.worldPosToCell(blockPos);
        this.baseRow = row;
        this.baseCol = col;
        this.selectedBlock.updateCurrentCells(row, col);

        // Giải phóng cell hiện tại của block (để không tự chặn mình)
        for (const cell of this.selectedBlock.currentCells) {
            this.boardManager.freeCell(cell.row, cell.col);
        }
    }

    // 2. Kéo block, clamp vị trí hợp lệ
    onTouchMove(event: EventTouch) {
        if (!this.selectedBlock) return;

        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);
        let t = -ray.o.y / ray.d.y;
        let hitPoint = new Vec3(ray.o.x + ray.d.x * t, 0, ray.o.z + ray.d.z * t);

        // Thêm offset để block giữ đúng điểm bắt đầu kéo
        let newBlockPos = new Vec3();
        Vec3.add(newBlockPos, hitPoint, this.offset);

        // Cập nhật vị trí cell tạm của block (tính theo offset so với baseRow/baseCol)
        const { row: dragRow, col: dragCol } = this.boardManager.worldPosToCell(newBlockPos);
        this.selectedBlock.updateCurrentCells(dragRow, dragCol);

        // Tính giới hạn di chuyển
        const limit = this.selectedBlock.getGroupLimit(this.boardManager);
        const { min, max } = this.selectedBlock.getWorldLimitPosition(limit, this.boardManager);

        // Clamp vào vùng hợp lệ
        let clampedX = math.clamp(newBlockPos.x, min.x, max.x);
        let clampedZ = math.clamp(newBlockPos.z, min.z, max.z);

        // Di chuyển block tới vị trí hợp lệ nhất
        this.selectedBlock.node.setWorldPosition(clampedX, 0, clampedZ);

        // Có thể highlight/đổi màu preview cell ở đây nếu muốn
    }

    // 3. Thả block, snap vào lưới nếu hợp lệ
    onTouchEnd(event: EventTouch) {
        if (!this.selectedBlock) return;

        // Snap về cell gần nhất hợp lệ
        const pos = this.selectedBlock.node.getWorldPosition();
        const { row, col } = this.boardManager.worldPosToCell(pos);

        if (this.selectedBlock.canPlaceAt(row, col, this.boardManager)) {
            const snapPos = this.boardManager.cellToWorldPos(row, col);
            this.selectedBlock.node.setWorldPosition(snapPos.x, snapPos.y, snapPos.z);
            this.selectedBlock.snapToGrid(row, col, this.boardManager);
        } else {
            // Trả về vị trí gốc nếu không thả hợp lệ (hoặc báo hiệu invalid)
            const origPos = this.boardManager.cellToWorldPos(this.baseRow, this.baseCol);
            this.selectedBlock.node.setWorldPosition(origPos.x, origPos.y, origPos.z);
            this.selectedBlock.snapToGrid(this.baseRow, this.baseCol, this.boardManager);
        }

        // Đánh dấu lại occupied
        for (const cell of this.selectedBlock.currentCells) {
            this.boardManager.occupyCell(cell.row, cell.col);
        }

        // Reset state
        this.selectedBlock = null;
        this.baseRow = -1;
        this.baseCol = -1;
        this.offset.set(Vec3.ZERO);
    }
}
