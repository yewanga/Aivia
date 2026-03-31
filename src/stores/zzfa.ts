import {ref} from 'vue'
import {defineStore} from 'pinia'
import type {
    ZzfaTemp,
    ZzrwTemp,
    ZzxdTemp,
    ZzqyTemp,
    ZzmbTemp,
} from '../interface/zzfaInterface'

export const useZzfaStore = defineStore('zzfaObject', () => {
    // 初始化为满足 ZzfaTemp 结构的默认值，避免后续访问时出现 undefined
    const zzfa = ref<ZzfaTemp>({
        basic: {id: '', mc: '', pid: '', zzmbGx: [], zzrwGx: [], zzxdGx: [], zzqyGx: []},
        zzrw: [],
        zzxd: [],
        zzqy: [],
        zzmb: [],
    })

    // 局部合并更新：只替换传入的字段
    function setZzfa(zzfaPartial: Partial<ZzfaTemp>): void {
        zzfa.value = {...zzfa.value, ...zzfaPartial}
    }

    // 完全替换整个对象
    function replaceZzfa(newZzfa: ZzfaTemp): void {
        zzfa.value = newZzfa
    }

    // 清空为默认初始值
    function clearZzfa(): void {
        zzfa.value = {
            basic: {id: '', mc: '', pid: '', zzmbGx: [], zzrwGx: [], zzxdGx: [], zzqyGx: []},
            zzrw: [],
            zzxd: [],
            zzqy: [],
            zzmb: [],
        }
    }

    // ---------- Helpers for collections (typed) ----------
    // Zzrw helpers
    function addZzrw(item: ZzrwTemp): void {
        zzfa.value.zzrw.push(item)
    }

    function updateZzrw(id: string, partial: Partial<ZzrwTemp>): void {
        const idx = zzfa.value.zzrw.findIndex((r) => r.id === id)
        if (idx !== -1) {
            const target = zzfa.value.zzrw[idx]
            Object.assign(target, partial)
        }
    }

    function removeZzrw(id: string): void {
        zzfa.value.zzrw = zzfa.value.zzrw.filter((r) => r.id !== id)
    }

    function findZzrw(id: string): ZzrwTemp | undefined {
        return zzfa.value.zzrw.find((r) => r.id === id)
    }

    // Zzxd helpers
    function addZzxd(item: ZzxdTemp): void {
        zzfa.value.zzxd.push(item)
    }

    function updateZzxd(id: string, partial: Partial<ZzxdTemp>): void {
        const idx = zzfa.value.zzxd.findIndex((r) => r.id === id)
        if (idx !== -1) {
            const target = zzfa.value.zzxd[idx]
            Object.assign(target, partial)
        }
    }

    function removeZzxd(id: string): void {
        zzfa.value.zzxd = zzfa.value.zzxd.filter((r) => r.id !== id)
    }

    function findZzxd(id: string): ZzxdTemp | undefined {
        return zzfa.value.zzxd.find((r) => r.id === id)
    }

    // Zzqy helpers
    function addZzqy(item: ZzqyTemp): void {
        zzfa.value.zzqy.push(item)
    }

    function updateZzqy(id: string, partial: Partial<ZzqyTemp>): void {
        const idx = zzfa.value.zzqy.findIndex((r) => r.id === id)
        if (idx !== -1) {
            const target = zzfa.value.zzqy[idx]
            Object.assign(target, partial)
        }
    }

    function removeZzqy(id: string): void {
        zzfa.value.zzqy = zzfa.value.zzqy.filter((r) => r.id !== id)
    }

    function findZzqy(id: string): ZzqyTemp | undefined {
        return zzfa.value.zzqy.find((r) => r.id === id)
    }

    // Zzmb helpers
    function addZzmb(item: ZzmbTemp): void {
        zzfa.value.zzmb.push(item)
    }

    function updateZzmb(id: string, partial: Partial<ZzmbTemp>): void {
        const idx = zzfa.value.zzmb.findIndex((r) => r.id === id)
        if (idx !== -1) {
            const target = zzfa.value.zzmb[idx]
            Object.assign(target, partial)
        }
    }

    function removeZzmb(id: string): void {
        zzfa.value.zzmb = zzfa.value.zzmb.filter((r) => r.id !== id)
    }

    function findZzmb(id: string): ZzmbTemp | undefined {
        return zzfa.value.zzmb.find((r) => r.id === id)
    }

    return {
        zzfa,
        setZzfa,
        replaceZzfa,
        clearZzfa,

        // zzrw actions
        addZzrw,
        updateZzrw,
        removeZzrw,
        findZzrw,

        // zzxd actions
        addZzxd,
        updateZzxd,
        removeZzxd,
        findZzxd,

        // zzqy actions
        addZzqy,
        updateZzqy,
        removeZzqy,
        findZzqy,

        // zzmb actions
        addZzmb,
        updateZzmb,
        removeZzmb,
        findZzmb,
    }
})