import { _decorator, Component, ICollisionEvent, Material, MeshCollider, MeshRenderer, Node, resources, tween, Vec3 } from 'cc';
import { TypeDirection } from '../Utils/Enum';
import { Door } from './Door';
import { PosCheck } from './PosCheck';
import { GridManager } from '../Core/GridManager';
import { Grid } from './Grid';
import { GameManager } from '../Core/GameManager';
import { BlockManager } from '../Core/BlockManager';
import { SoundManager } from '../Core/SoundManager';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property
    public materialIndex: number = 1;
    static materialCache: Record<string, Material> = {};

    @property([Vec3])
    targetPoss: Vec3[] = [];
    @property
    typeDirMoveOut: TypeDirection = 1;

    @property(Node)
    left: Node = null;
    @property(Node)
    right: Node = null;
    @property(Node)
    up: Node = null;
    @property(Node)
    down: Node = null;
    @property
    offsetUp: number = 0;
    @property
    offsetDown: number = 0;
    @property
    offsetLeft: number = 0;
    @property
    offsetRight: number = 0;
    listNodeOwnFrame: Node[] = [];
    public canMove: boolean = false;
    @property(Node)
    public door: Node = null;
    @property
    limitUpDown: boolean = false;
    @property
    limitLeftRight: boolean = false;

    onLoad() {
        if (this.materialIndex >= 1 && this.materialIndex <= 7) {
            this.setMaterialForCubes(this.materialIndex);
        }
        this.InitListNodeOwn();

    }

    start() {
        this.scheduleOnce(() => {
            this.SetPosTouchEnd();
        }, 0.2)
        // console.log(this.GetGroupLimit(this.listNodeOwnFrame))
        const collider = this.node.children[0].getComponent(MeshCollider);
        if (collider) {
            collider.on('onCollisionEnter', this.onCollisionEnter, this);
            collider.on('onCollisionExit', this.onCollisionExit, this);
        }
    }

    setMaterialForCubes(index: number) {
        const matName = `BlockMaterial-00${index}`;
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
        if (Block.materialCache[matPath]) {
            applyMaterial(Block.materialCache[matPath]);
            return;
        }

        // Nếu chưa có thì load rồi lưu vào cache
        resources.load(matPath, Material, (err, mat) => {
            if (err || !mat) {
                console.warn(`Không tìm thấy material: ${matPath}`);
                return;
            }
            Block.materialCache[matPath] = mat;
            applyMaterial(mat);
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

    onCollisionEnter(event: ICollisionEvent) {
        if (event.otherCollider.node.getComponent(Door) && event.otherCollider.node.getComponent(Door).materialIndex == this.materialIndex) {
            // console.log('', event.otherCollider.node.name);
            this.door = event.otherCollider.node;
        }
    }
    onCollisionExit(event: ICollisionEvent) {
        if (this.door == null || this.door !== event.otherCollider.node) return;
        // this.door = null;
    }
    InitListNodeOwn() {
        this.node.children.forEach(element => {
            if (element.getComponent(PosCheck)) {
                this.listNodeOwnFrame.push(element);
            }
        })
    }
    InitDataOfListNodeOwnFrame() {
        this.listNodeOwnFrame.forEach(element => {
            element.getComponent(PosCheck).InitDataPos();
        })
    }
    GetGroupLimit(): { left: number, right: number, up: number, down: number } {
        type Direction = 'left' | 'right' | 'up' | 'down';
        const matrix = GridManager.instance.gridNodes;
        const numRows = matrix.length;
        const numCols = matrix[0].length;

        const positions = this.listNodeOwnFrame.map(node => {
            const script = node.getComponent(PosCheck);
            return { row: script.rowOwn, col: script.colOwn };
        });

        const result = { left: 0, right: 0, up: 0, down: 0 };

        const checkDirection = (dir: Direction): number => {
            let offset = 0;
            while (true) {
                offset++;

                const newPositions = positions.map(pos => {
                    let r = pos.row;
                    let c = pos.col;

                    switch (dir) {
                        case 'left': c -= offset; break;
                        case 'right': c += offset; break;
                        case 'up': r -= offset; break;
                        case 'down': r += offset; break;
                    }

                    return { row: r, col: c };
                });

                for (let newPos of newPositions) {
                    const r = newPos.row;
                    const c = newPos.col;

                    if (r < 0 || r >= numRows || c < 0 || c >= numCols) {
                        return offset - 1;
                    }

                    const nodeAtNewPos = matrix[r][c];

                    if (!positions.some(p => p.row === r && p.col === c)) {
                        if (nodeAtNewPos.getComponent(Grid).CheckOccupied()) {
                            return offset - 1;
                        }
                    }
                }
            }
        };

        result.left = checkDirection('left');
        result.right = checkDirection('right');
        result.up = checkDirection('up');
        result.down = checkDirection('down');

        return result;
    }
    private GetStepSize(): { stepX: number, stepY: number } {
        const matrix = GridManager.instance.gridNodes;

        const stepX = Vec3.distance(
            matrix[0][0].worldPosition,
            matrix[0][1].worldPosition
        );

        const stepY = Vec3.distance(
            matrix[0][0].worldPosition,
            matrix[1][0].worldPosition
        );

        return { stepX, stepY };
    }
    GetWorldLimitPosition(
        limit: { left: number, right: number, up: number, down: number }
    ): { min: Vec3, max: Vec3 } {
        const { stepX, stepY } = this.GetStepSize();
        // console.log(stepX)
        // console.log(stepY)

        // console.log(data)
        let baseWorldPos: Vec3 = this.node.worldPosition;
        // console.log('stepX ',stepX);
        // console.log('stepY ',stepY)
        const halfStepX = stepX / 2;
        const halfStepY = stepY / 2;

        let frameUp = this.up.getComponent(PosCheck).nodeCloset;
        let frameDown = this.down.getComponent(PosCheck).nodeCloset;
        let frameLeft = this.left.getComponent(PosCheck).nodeCloset;
        let frameRight = this.right.getComponent(PosCheck).nodeCloset;
        // console.log(limit)
        let limitFrameUp = new Vec3(0, 0, frameUp.worldPosition.z - (limit.up * 2 + 1) * halfStepY + this.offsetUp);
        let limitFrameDown = new Vec3(0, 0, frameDown.worldPosition.z + (limit.down * 2 + 1) * halfStepY - this.offsetDown);

        let limitFrameRight = new Vec3(frameRight.worldPosition.x + (limit.right * 2 + 1) * halfStepX - this.offsetRight, 0, 0);
        let limitFrameLeft = new Vec3(frameLeft.worldPosition.x - (limit.left * 2 + 1) * halfStepX + this.offsetLeft, 0, 0);
        if (this.limitUpDown) {
            limitFrameUp = limitFrameDown = new Vec3(0, 0, baseWorldPos.z)
        }
        if (this.limitLeftRight) {
            limitFrameRight = limitFrameLeft = new Vec3(baseWorldPos.x, 0, 0);
        }
        let min: Vec3 = new Vec3(
            limitFrameLeft.x,
            baseWorldPos.y,
            limitFrameDown.z
        );

        let max: Vec3 = new Vec3(
            limitFrameRight.x,
            baseWorldPos.y,
            limitFrameUp.z
        );

        if (limit.left == 0 && limit.right == 0 && limit.up == 0 && limit.down == 0) {
            min = new Vec3(baseWorldPos.x, baseWorldPos.y, baseWorldPos.z);
            max = new Vec3(baseWorldPos.x, baseWorldPos.y, baseWorldPos.z);
        }
        return { min, max };
    }
    GetLimitNodePosOwnFrame(): { left: Node, right: Node, up: Node, down: Node } {
        let res: any = { left: null, right: null, up: null, down: null };

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (let item of this.listNodeOwnFrame) {
            const { x, y } = item.worldPosition;
            const nodeCloset = item.getComponent(PosCheck).nodeCloset;

            if (x <= minX) {
                minX = x;
                res.left = nodeCloset;
            }
            if (x >= maxX) {
                maxX = x;
                res.right = nodeCloset;
            }
            if (y <= minY) {
                minY = y;
                res.down = nodeCloset;
            }
            if (y >= maxY) {
                maxY = y;
                res.up = nodeCloset;
            }
        }

        return res;
    }

    SetPosTouchEnd() {
        let nodePosOrgin = this.listNodeOwnFrame[0];
        let closetNodeOrigin: Node = nodePosOrgin.getComponent(PosCheck).nodeCloset;
        const offset = new Vec3(
            closetNodeOrigin.worldPosition.x - nodePosOrgin.worldPosition.x,
            nodePosOrgin.worldPosition.y * 0,
            closetNodeOrigin.worldPosition.z - nodePosOrgin.worldPosition.z
        );

        // Dịch cả parent theo offset
        const newParentWorldPos = this.node.worldPosition.clone().add(offset);
        this.node.setWorldPosition(newParentWorldPos);
        // console.log('da set')
        this.MoveOutBlock();
    }
    MoveOutBlock() {
        this.scheduleOnce(() => {
            if (this.door == null || this.door.getComponent(Door).materialIndex !== this.materialIndex) return;
            // console.log('vao')
            let closetNodePs1 = this.listNodeOwnFrame[0].getComponent(PosCheck).nodeCloset;
            // let check = this.listNodeOwnFrame[0].getComponent(PosCheck).listTargetNodeCloset.filter(item => item == closetNodePs1);
            // if (check.length == 0)return;
            let effect = this.door.getComponent(Door).effect;
            effect.active = true;
            let targetMove = new Vec3();
            if (this.door.getComponent(Door).dirType == 1) {
                targetMove = this.node.worldPosition.clone().add(new Vec3(9, 0, 0));
            } else if (this.door.getComponent(Door).dirType == 2) {
                targetMove = this.node.worldPosition.clone().add(new Vec3(0, 0, 9));
            }
            else if (this.door.getComponent(Door).dirType == 3) {
                targetMove = this.node.worldPosition.clone().add(new Vec3(-9, 0, 0));
            }
            else if (this.door.getComponent(Door).dirType == 4) {
                targetMove = this.node.worldPosition.clone().add(new Vec3(0, 0, -9));
            }
            this.canMove = true;
            this.listNodeOwnFrame.forEach(item => {
                item.getComponent(PosCheck).ReBackValue();
            })
            SoundManager.instance.playSFX("click");

            this.door.getComponent(Door).DoorDown();
            BlockManager.instance.RemoveBlockInList(this.node);
            if (BlockManager.instance.CheckNoMoreBlock()) {
                console.log('No more block', ' You Win!!!');
            }
            tween(this.node)
                .to(0.5, { worldPosition: targetMove })
                .call(() => {
                    effect.active = false;
                    this.door.getComponent(Door).DoorUp();
                    this.node.active = false;
                })
                .start();
        }, 0.1)
    }
}
