export type BlockShape = { row: number, col: number }[];

export enum ShapeType {
    '1x1' = 0,
    '1x2' = 1,
    '2x2' = 2,
}
export const SHAPE_TYPE_LABELS = ['1x1', '1x2', '2x2'];

export const SHAPES: Record<string, BlockShape> = {
    '1x1': [ { row: 0, col: 0 } ],
    '1x2': [ { row: 0, col: 0 }, { row: 0, col: 1 } ],
    '2x2': [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
    ],
};
