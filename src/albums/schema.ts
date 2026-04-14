import { t } from "elysia";

export const albumQuerySchema = t.Object({
    sortField: t.UnionEnum(['title', 'year'], { default: 'title' }),
    sortOrder: t.UnionEnum(['asc', 'desc'], { default: 'asc' })
})