import { InferSelectModel, Table } from "drizzle-orm"

export interface SortOptions<T extends Table>{
    field: keyof InferSelectModel<T>
    order: 'asc' | 'desc'
}