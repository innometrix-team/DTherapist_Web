const mode = import.meta.env.MODE

const STORE_NAME = mode === 'production' ? "@DTHERAPIST:" : `@DTHERAPIST:${mode}`

export const STORE_KEYS = {
    AUTH: `${STORE_NAME}:AUTH`
}