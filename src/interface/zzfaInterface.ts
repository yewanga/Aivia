/**
 * Basic temporary fields shared by some Temps
 */
export interface Temp {
    id: string; //id
    mc: string; // 名称
    pid: string; // 父级 id
    zzmbGx?: string[]; //关联zzmb
    zzrwGx?: string[]; //关联zzrw
    zzxdGx?: string[]; //关联zzrw
    zzqyGx?: string[]; //关联zzrw
}

/**
 * 任务信息
 */
export interface ZzrwTemp extends Temp {
    rwdh: string;
    rwms: string;
}

/**
 * 行动信息
 */
export interface ZzxdTemp extends Temp {
    xdys: string;
    xdsj: number;
}

/**
 * 区域信息
 */
export interface ZzqyTemp extends Temp {
    qylx: string;
    lstDj: number[];
}

/**
 * 目标信息
 */
export interface ZzmbTemp extends Temp {
    mblx: string;
    mbwz: number;
}

/**
 * 方案信息，组合各模块
 */
export interface ZzfaTemp {
    basic: Temp;
    zzrw: ZzrwTemp[];
    zzxd: ZzxdTemp[];
    zzqy: ZzqyTemp[];
    zzmb: ZzmbTemp[];
}