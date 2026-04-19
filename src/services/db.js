import Dexie from 'dexie'

export const db = new Dexie('BeadStudio')

db.version(1).stores({
  works: '++id, name, gridSize, palette, createdAt, updatedAt',
  templates: '++id, name, category, difficulty, palette, gridSize, usageCount',
  settings: 'id',
  favorites: '++id, workId, templateId, createdAt',
})

// Works operations
export const workDB = {
  async create(work) {
    return await db.works.add({
      ...work,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  },

  async getAll() {
    return await db.works.orderBy('updatedAt').reverse().toArray()
  },

  async get(id) {
    return await db.works.get(id)
  },

  async update(id, changes) {
    return await db.works.update(id, { ...changes, updatedAt: new Date() })
  },

  async delete(id) {
    return await db.works.delete(id)
  },
}

// Templates operations
export const templateDB = {
  async getAll() {
    return await db.templates.toArray()
  },

  async getByCategory(category) {
    return await db.templates.where('category').equals(category).toArray()
  },

  async incrementUsage(id) {
    const template = await db.templates.get(id)
    if (template) {
      await db.templates.update(id, { usageCount: (template.usageCount || 0) + 1 })
    }
  },
}
