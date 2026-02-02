"use strict";
/**
 * Mock Product Repository for Testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProductRepository = void 0;
const Product_1 = require("../../src/domain/entities/Product");
class MockProductRepository {
    constructor() {
        this.products = new Map();
        this.idCounter = 1;
    }
    // Helper to reset state between tests
    reset() {
        this.products.clear();
        this.idCounter = 1;
    }
    // Helper to seed data
    seed(products) {
        products.forEach((p) => {
            const id = p.id || `prod${this.idCounter++}`;
            this.products.set(id, { ...p, id });
        });
    }
    async findById(id) {
        const props = this.products.get(id);
        if (!props)
            return null;
        return Product_1.Product.fromPersistence(props);
    }
    async findAll(filters = {}, pagination = { page: 1, limit: 20 }) {
        let items = Array.from(this.products.values());
        // Apply filters
        if (filters.isActive !== undefined) {
            items = items.filter((p) => p.isActive === filters.isActive);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            items = items.filter((p) => p.name.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.tags?.some((t) => t.toLowerCase().includes(search)));
        }
        if (filters.category) {
            items = items.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
        }
        if (filters.sellerId) {
            items = items.filter((p) => p.sellerId === filters.sellerId);
        }
        if (filters.minPrice !== undefined) {
            items = items.filter((p) => p.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            items = items.filter((p) => p.price <= filters.maxPrice);
        }
        if (filters.tags && filters.tags.length > 0) {
            items = items.filter((p) => filters.tags.some((t) => p.tags?.includes(t)));
        }
        // Apply sorting
        const sortBy = pagination.sortBy || 'createdAt';
        const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
        items.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal < bVal)
                return -1 * sortOrder;
            if (aVal > bVal)
                return 1 * sortOrder;
            return 0;
        });
        const total = items.length;
        const start = (pagination.page - 1) * pagination.limit;
        const paginatedItems = items.slice(start, start + pagination.limit);
        return {
            items: paginatedItems.map((p) => Product_1.Product.fromPersistence(p)),
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit),
            },
        };
    }
    async findBySellerId(sellerId, pagination) {
        return this.findAll({ sellerId, isActive: true }, pagination);
    }
    async findByCategory(category, pagination) {
        return this.findAll({ category, isActive: true }, pagination);
    }
    async save(product) {
        const id = `prod${this.idCounter++}`;
        const props = {
            ...product.toPersistence(),
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.products.set(id, props);
        return Product_1.Product.fromPersistence(props);
    }
    async update(id, product) {
        if (!this.products.has(id))
            return null;
        const existing = this.products.get(id);
        const updated = {
            ...existing,
            ...product.toPersistence(),
            id,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
        };
        this.products.set(id, updated);
        return Product_1.Product.fromPersistence(updated);
    }
    async delete(id) {
        const existing = this.products.get(id);
        if (!existing)
            return false;
        existing.isActive = false;
        this.products.set(id, existing);
        return true;
    }
    async hardDelete(id) {
        return this.products.delete(id);
    }
    async count(filters) {
        const result = await this.findAll(filters, { page: 1, limit: 99999 });
        return result.pagination.total;
    }
    async exists(id) {
        return this.products.has(id);
    }
    async bulkUpdate(ids, update) {
        let count = 0;
        ids.forEach((id) => {
            const existing = this.products.get(id);
            if (existing) {
                this.products.set(id, {
                    ...existing,
                    ...update,
                    updatedAt: new Date(),
                });
                count++;
            }
        });
        return count;
    }
    async findFeatured(limit = 10) {
        const items = Array.from(this.products.values())
            .filter((p) => p.isActive)
            .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
            .slice(0, limit);
        return items.map((p) => Product_1.Product.fromPersistence(p));
    }
    async search(query, pagination) {
        return this.findAll({ search: query, isActive: true }, pagination);
    }
}
exports.MockProductRepository = MockProductRepository;
//# sourceMappingURL=MockProductRepository.js.map