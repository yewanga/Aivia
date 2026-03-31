import {ref, computed} from 'vue'
import {defineStore} from 'pinia'

export const useZzfaStore = defineStore('zzfa', () => {
    const zzfaBasic = ref({
        basic: {},
        zzrw: {},
        zzxd: {},
        hlhx: {},
    })

    function setZzfa(zzfaTemp) {
        zzfaBasic = zzfaTemp
    }
})