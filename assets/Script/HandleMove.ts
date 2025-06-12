import { _decorator, Component, Camera, Node, input, Input, EventTouch, Vec3, PhysicsSystem, geometry } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HandleMove')
export class HandleMove extends Component {
    @property({ type: Camera })
    mainCamera: Camera = null!;

    private selectedBlock: Node | null = null;
    private offset: Vec3 = new Vec3();

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

        if (PhysicsSystem.instance.raycast(ray)) {
            const results = PhysicsSystem.instance.raycastResults;
            for (const r of results) {
                if (r.collider.node.name.startsWith("Block")) {
                    this.selectedBlock = r.collider.node;
                    // Offset giữa block và vị trí chạm
                    Vec3.subtract(this.offset, this.selectedBlock.worldPosition, r.hitPoint);
                    break;
                }
            }
        }
    }

    // Kéo di chuyển
    onTouchMove(event: EventTouch) {
        if (this.selectedBlock) {
            const touchPos = event.getLocation();
            const ray = this.mainCamera.screenPointToRay(touchPos.x, touchPos.y);

            // Giao điểm ray với mặt phẳng Y=0 (bàn chơi)
            let t = -ray.o.y / ray.d.y;
            let hitPoint = new Vec3(
                ray.o.x + ray.d.x * t,
                0,
                ray.o.z + ray.d.z * t
            );
            // Đặt lại vị trí block (bám theo touch)
            Vec3.add(hitPoint, hitPoint, this.offset);
            this.selectedBlock.setWorldPosition(hitPoint);
        }
    }

    onTouchEnd(event: EventTouch) {
        this.selectedBlock = null;
    }
}
