import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridGenerator')
export class GridGenerator extends Component {
    @property({ type: Prefab })
    gridPrefab: Prefab = null!;

    @property
    gridSize: number = 9; // Kích thước lưới (8x8)

    @property
    spacing: number = 2.0; // Khoảng cách giữa các grid

    @property
    startPos: Vec3 = new Vec3(8.3, -1, 8.3); // Vị trí bắt đầu (góc lớn nhất)

    start() {
        this.createGrid();
    }

    createGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = this.startPos.x - col * this.spacing;
                const y = this.startPos.y;
                const z = this.startPos.z - row * this.spacing;

                const pos = new Vec3(x, y, z);

                const gridNode = instantiate(this.gridPrefab);
                gridNode.setPosition(pos);
                gridNode.parent = this.node;
            }
        }
    }
}
