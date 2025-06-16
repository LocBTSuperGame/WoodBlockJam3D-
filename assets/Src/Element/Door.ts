import { _decorator, BoxCollider, Component, ICollisionEvent, Material, MeshRenderer, Node, resources, tween, Vec3 } from 'cc';
import { TypeDirection } from '../Utils/Enum';
const { ccclass, property } = _decorator;

@ccclass('Door')
export class Door extends Component {
    @property
    public materialIndex: number = 1;
    static materialCache: Record<string, Material> = {};

    @property
    public dirType: TypeDirection = 1;

    @property(Node)
    effect: Node = null;

    onLoad() {
        // if (this.materialIndex >= 1 && this.materialIndex <= 7) {
        //     this.setMaterialForCubes(this.materialIndex);
        // } else {
        //     this.checkMaterialIndex();
        // }
        this.effect.active = false;
    }

    start() {
        const collider = this.node.getComponent(BoxCollider);
        if (collider) {
            // collider.on('onCollisionEnter', this.onCollisionEnter, this);
            // collider.on('onCollisionExit', this.onCollisionExit, this);
        }
    }

    onCollisionEnter(event: ICollisionEvent) {
        // let node = event.otherCollider.node;
        // let foundBlock: Block | null = null;

        // // if (blockComp && blockComp.materialIndex === this.materialIndex) {
        // //     blockComp.Node.active = false;
        // // }
        // console.log('Ray hit node:', node.name);
        // // Lặp lên các node cha đến khi có component Block hoặc hết node
        // while (node) {
        //     const blockComp = node.getComponent(Block);
        //     if (blockComp) {
        //         foundBlock = blockComp;
        //         break;
        //     }
        //     node = node.parent;
        // }

        // if (!foundBlock) return;
        // if (foundBlock.materialIndex !== this.materialIndex) {
        //     console.warn(`Block material index ${foundBlock.materialIndex} không khớp với Wall index ${this.materialIndex}`);
        //     return;
        // }
        // else {
        //     console.log(`Block material index ${foundBlock.materialIndex} khớp với Wall index ${this.materialIndex}`);
        //     foundBlock.isHide = true; // Ẩn block khi va chạm với tường
    }

    onCollisionExit(event: ICollisionEvent) {
    }

    setMaterialForCubes(index: number) {
        const matName = `DoorMaterial-00${index}`;
        const matPath = `Material/${matName}`;

        const applyMaterial = (mat: Material) => {
            this.node.children.forEach(child => {
                if (child.name.startsWith('Cube')) {
                    const meshRenderer = child.getComponent(MeshRenderer);
                    if (meshRenderer) {
                        meshRenderer.setMaterial(mat, 0);
                    }
                }
            });
        };

        // Dùng cache nếu đã có
        if (Door.materialCache[matPath]) {
            applyMaterial(Door.materialCache[matPath]);
            return;
        }

        // Nếu chưa có thì load rồi lưu vào cache
        resources.load(matPath, Material, (err, mat) => {
            if (err || !mat) {
                console.warn(`Không tìm thấy material: ${matPath}`);
                return;
            }
            Door.materialCache[matPath] = mat;
            applyMaterial(mat);
        });
    }

    checkMaterialIndex() {
        // Tìm Cube con đầu tiên có MeshRenderer và material
        for (const child of this.node.children) {
            for (const child of this.node.children) {
                if (child.name.startsWith('Cube')) {
                    const meshRenderer = child.getComponent(MeshRenderer);
                    if (meshRenderer) {
                        const mat = meshRenderer.getMaterial(0);
                        if (mat) {
                            const matName = mat.name;
                            const match = matName.match(/DoorMaterial-00(\d+)/);
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

    DoorDown() {
        tween(this.node)
            .to(0.3, { worldPosition: new Vec3(this.node.worldPosition.add(new Vec3(0, -1.5, 0))) })
            .start();
    }
    DoorUp() {
        tween(this.node)
            .to(0.3, { worldPosition: new Vec3(this.node.worldPosition.add(new Vec3(0, 1.5, 0))) })
            .start();
    }
}
