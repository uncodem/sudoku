
export type CellState = {
    value: number | null;
    given: boolean;
    notes: Set<number>;
}

export type CellElement = {
    root: HTMLElement;
    valueElement: HTMLElement;
    noteElements: HTMLElement[];
};
