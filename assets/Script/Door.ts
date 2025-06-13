import { _decorator, BoxCollider, Component, ICollisionEvent, Material, MeshRenderer, Node, resources, tween, Vec3 } from 'cc';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('Wall')
export class Wall extends Component {
    @property
    public materialIndex: number = 1;

    // @property(Node)
    // effect: Node = null;

    onLoad() {
        if (this.materialIndex >= 1 && this.materialIndex <= 7) {
            this.setMaterialForCubes(this.materialIndex);
        } else {
            this.checkMaterialIndex();
        }
    }

    start() {
        const collider = this.node.getComponent(BoxCollider);
        if (collider) {
            collider.on('onCollisionEnter', this.onCollisionEnter, this);
            collider.on('onCollisionExit', this.onCollisionExit, this);
        }
    }

    onCollisionEnter(event: ICollisionEvent) {
        let node = event.otherCollider.node;
        let foundBlock: Block | null = null;

        // if (blockComp && blockComp.materialIndex === this.materialIndex) {
        //     blockComp.Node.active = false;
        // }
        console.log('Ray hit node:', node.name);
        // Lặp lên các node cha đến khi có component Block hoặc hết node
        while (node) {
            const blockComp = node.getComponent(Block);
            if (blockComp) {
                foundBlock = blockComp;
                break;
            }
            node = node.parent;
        }

        if (!foundBlock) return;
        if (foundBlock.materialIndex !== this.materialIndex) {
            console.warn(`Block material index ${foundBlock.materialIndex} không khớp với Wall index ${this.materialIndex}`);
            return;
        }
        else {
            console.log(`Block material index ${foundBlock.materialIndex} khớp với Wall index ${this.materialIndex}`);
            foundBlock.isHide = true; // Ẩn block khi va chạm với tường
        }


        // const blockNode = event.otherCollider.node;
        // // Giả sử Block có script với thuộc tính typeColor
        // const blockComp = blockNode.getComponent('Block');
        // if (blockComp && blockComp.typeColor === this.typeColor) {
        //     this.effect.active = true;
        //     // Đẩy block ra khỏi cửa (tùy hướng cửa)
        //     let dir = new Vec3();
        //     switch (this.dirType) {
        //         case TypeDirection.Up:    dir = new Vec3(0, 0, 3); break;
        //         case TypeDirection.Down:  dir = new Vec3(0, 0, -3); break;
        //         case TypeDirection.Left:  dir = new Vec3(-3, 0, 0); break;
        //         case TypeDirection.Right: dir = new Vec3(3, 0, 0); break;
        //     }
        //     tween(blockNode)
        //         .to(0.3, { worldPosition: blockNode.worldPosition.add(dir) })
        //         .start();
        //     // Gửi sự kiện ra ngoài (nếu muốn)
        //     // GameManager.instance.onBlockExit(blockNode);
        // } else {
        //     // Có thể cho hiệu ứng cảnh báo nếu màu không khớp
        //     // this.effect.active = false;
    }

    onCollisionExit(event: ICollisionEvent) {
        console.log('Block exited wall:', event.otherCollider.node.name);
    }

    setMaterialForCubes(index: number) {
        const matName = `DoorMaterial-00${index}`;
        resources.load(`Material/${matName}`, Material, (err, mat) => {
            if (err || !mat) {
                console.warn(`Không tìm thấy material: ${matName}`);
                return;
            }
            this.node.children.forEach(child => {
                // Tùy bạn đặt tên child là gì, mặc định là "Cube"
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
        // Tìm Cube con đầu tiên có MeshRenderer và material
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
                            console.log(`Door "${this.node.name}" dùng material index: ${this.materialIndex}`);
                        } else {
                            console.log(`Door "${this.node.name}" material không đúng định dạng: ${matName}`);
                        }
                        break;
                    }
                }
            }
        }
    }
}
