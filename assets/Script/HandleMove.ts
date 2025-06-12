import { _decorator, Component, Camera, input, Input, EventTouch, Node, Vec3, PhysicsSystem } from 'cc';
import { BoardManager } from './BoardManager';
const { ccclass, property } = _decorator;

@ccclass('HandleMove')
export class HandleMove extends Component {
    @property({ type: Camera })
    mainCamera: Camera = null!;

    @property(BoardManager)
    boardManager: BoardManager = null!;

    private selectedBlock: Node | null = null;
    private originalPos: Vec3 = new Vec3();

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
        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);

        // Raycast chuẩn 3D bằng PhysicsSystem
        if (PhysicsSystem.instance.raycast(ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            for (const r of results) {
                if (r.collider.node.name.startsWith("Block")) {
                    this.selectedBlock = r.collider.node;
                    this.originalPos = this.selectedBlock.getWorldPosition();
                    break;
                }
            }
        }
    }

    onTouchMove(event: EventTouch) {
        if (!this.selectedBlock) return;
        const touchPos = event.getLocation();
        const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);

        // Giao với mặt phẳng Y=0
        let t = -ray.o.y / ray.d.y;
        let pos = new Vec3(
            ray.o.x + ray.d.x * t,
            0,
            ray.o.z + ray.d.z * t
        );
        this.selectedBlock.setWorldPosition(pos);
    }

    onTouchEnd(event: EventTouch) {
        if (!this.selectedBlock) return;

        // Snap: tìm ô grid gần nhất
        const blockPos = this.selectedBlock.getWorldPosition();
        let minDist = Infinity;
        let snapRow = -1, snapCol = -1;
        for (let row = 0; row < this.boardManager.gridSize; row++) {
            for (let col = 0; col < this.boardManager.gridSize; col++) {
                let gridCenter = this.boardManager.gridCenters[row][col];
                let dist = Vec3.distance(blockPos, new Vec3(gridCenter.x, 0, gridCenter.z));
                if (dist < minDist) {
                    minDist = dist;
                    snapRow = row;
                    snapCol = col;
                }
            }
        }

        // Snap nếu hợp lệ (gần center và chưa bị chiếm)
        if (
            minDist < this.boardManager.gridSpacing / 2 &&
            this.boardManager.isCellFree(snapRow, snapCol)
        ) {
            const snapPos = new Vec3(
                this.boardManager.gridCenters[snapRow][snapCol].x,
                0,
                this.boardManager.gridCenters[snapRow][snapCol].z
            );
            this.selectedBlock.setWorldPosition(snapPos);
            this.boardManager.occupyCell(snapRow, snapCol);
        } else {
            // Không hợp lệ, trả về chỗ cũ
            this.selectedBlock.setWorldPosition(this.originalPos);
        }
        this.selectedBlock = null;
    }
}


// import { _decorator, Component, Camera, Node, input, Input, EventTouch, Vec3, PhysicsSystem, geometry } from 'cc';
// const { ccclass, property } = _decorator;

// @ccclass('HandleMove')
// export class HandleMove extends Component {
//     @property({ type: Camera })
//     mainCamera: Camera = null!;

//     private selectedBlock: Node | null = null;
//     private offset: Vec3 = new Vec3();

//     onLoad() {
//         input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
//         input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
//         input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
//     }

//     onDestroy() {
//         input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
//         input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
//         input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
//     }

//     onTouchStart(event: EventTouch) {
//         const touchPos = event.getLocation();
//         const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);

//         if (PhysicsSystem.instance.raycast(ray)) {
//             const results = PhysicsSystem.instance.raycastResults;
//             for (const r of results) {
//                 if (r.collider.node.name.startsWith("Block")) {
//                     this.selectedBlock = r.collider.node;
//                     // Offset giữa block và vị trí chạm
//                     Vec3.subtract(this.offset, this.selectedBlock.worldPosition, r.hitPoint);
//                     break;
//                 }
//             }
//         }
//     }

//     // Kéo di chuyển
//     onTouchMove(event: EventTouch) {
//         if (this.selectedBlock) {
//             const touchPos = event.getLocation();
//             const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);

//             // Giao điểm ray với mặt phẳng Y=0 (bàn chơi)
//             let t = -ray.o.y / ray.d.y;
//             let hitPoint = new Vec3(
//                 ray.o.x + ray.d.x * t,
//                 0,
//                 ray.o.z + ray.d.z * t
//             );
//             // Đặt lại vị trí block (bám theo touch)
//             Vec3.add(hitPoint, hitPoint, this.offset);
//             this.selectedBlock.setWorldPosition(hitPoint);
//         }
//     }

//     onTouchEnd(event: EventTouch) {
//         this.selectedBlock = null;
//     }
// }
