export interface FlowtimeInterval {
    min: number;
    max: number;
    break: number;
}

export interface UserConfig {
    intervals: FlowtimeInterval[];
}
