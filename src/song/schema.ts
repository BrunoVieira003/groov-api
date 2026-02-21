import { t } from "elysia";

export const uploadBodySchema = t.Object({
    file: t.File({
        type: 'audio/mpeg'
    })
})