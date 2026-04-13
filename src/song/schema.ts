import { t } from "elysia";

export const uploadBodySchema = t.Object({
    file: t.File({
        type: 'audio/mpeg'
    })
})

export const querySchema = t.Object({
    sortField: t.UnionEnum(['title', 'createdAt', 'updatedAt'], {default: 'createdAt'}),
    sortOrder: t.UnionEnum(['asc', 'desc'], {default: 'asc'})
})