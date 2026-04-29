/**
 * Stock API Service
 * 
 * API functions for stock/assets data.
 * Uses the centralized API client.
 */

import { apiClient } from '../api';

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

const ENDPOINTS = {
    STOCK_LIST: '/stock',
    STOCK_DETAIL: (id) => `/stock/${id}`,
    STOCK_STATS: '/stock/stats',
    STOCK_ADJUST: (id) => `/stock/${id}/adjust-quantity`,
    STOCK_HISTORY: (id) => `/stock/${id}/history`,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch all stock items.
 * 
 * @param {Object} filters - Optional filters
 * @param {string} filters.search - Search query
 * @param {string} filters.category - Category filter
 * @param {string} filters.status - Status filter
 * @returns {Promise<Array>} List of stock items
 */
// export async function fetchStockItems(filters = {}) {
//     return apiClient.get(ENDPOINTS.STOCK_LIST, { params: filters });
// }

export async function fetchStockItems(filters = {}) {
    const res = await apiClient.get(ENDPOINTS.STOCK_LIST, { params: filters });
    return res.data; // ✅ only array return
}

/**
 * Fetch a single stock item by ID.
 * 
 * @param {string|number} id - Stock item ID
 * @returns {Promise<Object>} Stock item details
 */
// export async function fetchStockItem(id) {
//     return apiClient.get(ENDPOINTS.STOCK_DETAIL(id));
// }

export async function fetchStockItem(id) {
    const res = await apiClient.get(ENDPOINTS.STOCK_DETAIL(id));
    return res.data;
}

/**
 * Fetch stock statistics (total value, count, low stock, etc.)
 * 
 * @returns {Promise<Object>} Stock statistics
 */
// export async function fetchStockStats() {
//     return apiClient.get(ENDPOINTS.STOCK_STATS);
// }

export async function fetchStockStats() {
    const res = await apiClient.get(ENDPOINTS.STOCK_STATS);
    return res.data; // ✅
}

/**
 * Add a new stock item.
 * 
 * @param {Object} itemData - Item details
 * @returns {Promise<Object>} Created item
 */
// export async function addStockItem(itemData) {
//     return apiClient.post(ENDPOINTS.STOCK_LIST, itemData);
// }

export async function addStockItem(itemData) {
    const res = await apiClient.post(ENDPOINTS.STOCK_LIST, itemData);
    return res.data;
}

/**
 * Update a stock item.
 * 
 * @param {string|number} id - Stock item ID
 * @param {Object} itemData - Updated details
 * @returns {Promise<Object>} Updated item
 */
// export async function updateStockItem(id, itemData) {
//     return apiClient.put(ENDPOINTS.STOCK_DETAIL(id), itemData);
// }

export async function updateStockItem(id, itemData) {
    const res = await apiClient.put(ENDPOINTS.STOCK_DETAIL(id), itemData);
    return res.data;
}

/**
 * Delete a stock item.
 * 
 * @param {string|number} id - Stock item ID
 * @returns {Promise<void>}
 */
// export async function deleteStockItem(id) {
//     return apiClient.delete(ENDPOINTS.STOCK_DETAIL(id));
// }

export async function deleteStockItem(id) {
    const res = await apiClient.delete(ENDPOINTS.STOCK_DETAIL(id));
    return res.data;
}

/**
 * Adjust stock quantity by a delta.
 * 
 * @param {string|number} id - Stock item ID
 * @param {number} delta - Amount to add/subtract
 * @returns {Promise<Object>} Updated item
 */
export async function adjustStockQuantity(id, delta) {
    const res = await apiClient.patch(ENDPOINTS.STOCK_ADJUST(id), { delta });
    return res.data;
}

/**
 * Fetch stock transaction history.
 * 
 * @param {string|number} id - Stock item ID
 * @returns {Promise<Array>} Transaction history
 */
export async function fetchStockHistory(id) {
    const res = await apiClient.get(ENDPOINTS.STOCK_HISTORY(id));
    return res.data;
}
