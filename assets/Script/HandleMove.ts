import { _decorator, Component, Camera, input, Input, EventTouch, Vec3, Node, PhysicsSystem } from 'cc';
import { BoardManager } from './BoardManager';
import { Block } from './Block';
const { ccclass, property } = _decorator;

const MOVE_THRESHOLD = 20; // px hoặc tùy chỉnh cho hợp lý

@ccclass('HandleMove')
export class HandleMove extends Component {
    @property({ type: Camera })
    mainCamera: Camera = null!;
    @property(BoardManager)
    boardManager: BoardManager = null!;

    private selectedBlock: Block | null = null;
    private dragging = false;

    // Khởi tạo Vec3 trong onLoad thay vì khai báo trực tiếp
    private startTouchPos!: Vec3;
    private lastMoveTouch!: Vec3;

    onLoad() {
        // Khởi tạo các vector
        this.startTouchPos = new Vec3();
        this.lastMoveTouch = new Vec3();

        // Register event listeners
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
        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);
        let foundBlock: Block | null = null;

        // Raycast để lấy block (block phải có collider)
        if (PhysicsSystem.instance.raycast(ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            for (const r of results) {
                let node = r.collider.node;
                while (node) {
                    const blockComp = node.getComponent(Block);
                    if (blockComp) {
                        foundBlock = blockComp;
                        break;
                    }
                    node = node.parent;
                }
                if (foundBlock) break;
            }
        }
        if (!foundBlock) return;

        this.selectedBlock = foundBlock;
        const blockPos = this.selectedBlock.node.getWorldPosition();
        const { row, col } = this.boardManager.worldPosToCell(blockPos);

        // Đảm bảo board manager tồn tại
        if (!this.boardManager) {
            console.error('Board Manager is not set!');
            return;
        }

        this.selectedBlock.snapToGrid(row, col, this.boardManager);
        this.dragging = true;

        const startTouch = event.getLocation();
        this.startTouchPos.set(startTouch.x, 0, startTouch.y);
        this.lastMoveTouch.set(startTouch.x, 0, startTouch.y);
    }

    onTouchMove(event: EventTouch) {
        if (!this.selectedBlock || !this.dragging) return;

        const touchPos = event.getLocation();
        // Tính delta kể từ lần cuối move thành công
        const deltaX = touchPos.x - this.lastMoveTouch.x;
        const deltaY = touchPos.y - this.lastMoveTouch.z;

        // Chỉ cho phép di chuyển một hướng tại một thời điểm (vuông góc)
        let dir: { dr: number, dc: number } | null = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > MOVE_THRESHOLD) {
                dir = { dr: 0, dc: deltaX < 0 ? 1 : -1 }; // trái/phải
            }
        } else {
            if (Math.abs(deltaY) > MOVE_THRESHOLD) {
                dir = { dr: deltaY < 0 ? -1 : 1, dc: 0 }; // lên/xuống
            }
        }
        if (dir && this.selectedBlock.canMove(dir, this.boardManager)) {
            this.selectedBlock.move(dir, this.boardManager);
            // Cập nhật lại vị trí touch cuối để chỉ move từng bước 1
            this.lastMoveTouch.set(touchPos.x, 0, touchPos.y);
        }
    }

    onTouchEnd(event: EventTouch) {
        if (this.selectedBlock) {
            // Kiểm tra điều kiện ẩn block (có thể thêm các điều kiện khác)
            if (this.selectedBlock.isHide) {
                this.selectedBlock.hide(this.boardManager);
            }
            this.selectedBlock = null;
            this.dragging = false;
        }
    }
}

