import { _decorator, Camera, Canvas, Component, EventTouch, Input, input, math, Node, PhysicsSystem, UI, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { Block } from '../Element/Block';
import { DeviceDirector } from '../Script/DeviceDirector';
import { BlockManager } from './BlockManager';

const { ccclass, property } = _decorator;

@ccclass('InputManager')
export class InputManager extends Component {
    @property(Camera)
    mainCam: Camera = null;
    private nodeDetect: Node = null;
    private offset: Vec3 = new Vec3();
    checkFirst: boolean = false;

    @property(Canvas)
    firstUI: Canvas = null;
    onLoad() {
        input.on(Input.EventType.TOUCH_START, this.onMouseDown, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onMouseDrag, this);
        input.on(Input.EventType.TOUCH_END, this.onMouseUp, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onMouseUp, this);
    }
    GetPosWorldCam(event: EventTouch): any {
        let touchPos = event.getLocation();
        return this.mainCam.screenPointToRay(touchPos.x, touchPos.y);
    }
    onMouseDown(event: EventTouch) {
        if (!GameManager.instance.checkCanTouch) return;
        if (!this.checkFirst) {
            this.firstUI.node.active = false;
            this.checkFirst = true;
        }
        if (BlockManager.instance.blockUsedCount >= BlockManager.instance.blockUsedCountMax) {
            DeviceDirector.instance.redirectToStore();
        }
        if (PhysicsSystem.instance.raycastClosest(this.GetPosWorldCam(event))) {
            const res = PhysicsSystem.instance.raycastClosestResult;
            const hitNode = res.collider.node;
            if (hitNode !== null && hitNode.parent.getComponent(Block) && !hitNode.parent.getComponent(Block).canMove) {
                GameManager.instance.checkFirst = true;
                this.nodeDetect = hitNode.parent;
            }
        }
    }

    private onMouseDrag(event: EventTouch) {
        if (this.nodeDetect == null) return;
        if (PhysicsSystem.instance.raycastClosest(this.GetPosWorldCam(event))) {
            const hitPoint = PhysicsSystem.instance.raycastClosestResult.hitPoint;

            let newPos = new Vec3();
            Vec3.add(newPos, hitPoint, this.offset);
            let blockCom = this.nodeDetect.getComponent(Block);
            blockCom.InitDataOfListNodeOwnFrame();
            const limit = blockCom.GetGroupLimit(); // { left, right, up, down }
            const data = blockCom.GetWorldLimitPosition(limit); // { min: Vec3, max: Vec3 }
            // console.log('limit ',limit);
            // console.('data pos ',data);
            // console.log('pos ', this.nodeDetect.worldPosition)
            let clampedX: number = math.clamp(hitPoint.x, data.min.x, data.max.x);
            let clampedZ: number = math.clamp(hitPoint.z, data.min.z, data.max.z);
            // this.node.children[0].getComponent(PosCheck).FindNodeCloset();
            newPos.y = 0;  // y co dinh
            this.nodeDetect.setWorldPosition(clampedX, 0, clampedZ);
        }
    }
    private onMouseUp(event: EventTouch) {
        if (this.nodeDetect == null) return;
        this.nodeDetect.getComponent(Block).SetPosTouchEnd();
        this.nodeDetect = null;
    }
}


