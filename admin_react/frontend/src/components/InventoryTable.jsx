import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit2, Trash2, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

const InventoryTable = ({
  items,
  loading,
  onEditItem,
  onDeleteItem,
  editingItemId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [deleteModalItem, setDeleteModalItem] = useState(null);

  // Extract unique categories from item list
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || 'General'));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  // Filter items by search input (name or SKU) and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  const handleConfirmDelete = () => {
    if (deleteModalItem) {
      onDeleteItem(deleteModalItem.id);
      setDeleteModalItem(null);
    }
  };

  return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl backdrop-blur-md">
      {/* Top Bar: Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="relative w-full sm:w-48 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-white text-slate-900">
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {loading ? (
                // Skeleton rows loading state
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-36 bg-slate-200 rounded mb-1" />
                      <div className="h-3 w-20 bg-slate-200/60 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 w-16 bg-slate-200 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-8 w-16 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-10 h-10 text-slate-400 mb-1" />
                      <p className="font-medium text-slate-600">No inventory items found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm || selectedCategory !== 'ALL'
                          ? 'Try adjusting your search or category filter.'
                          : 'Add your first item using the form on the left.'}
                      </p>
                    </div>
                  </td>
                </tr>
            ) : (
              // Data rows
              filteredItems.map((item) => {
                const isLowStock = item.quantity < 10;
                const isCurrentlyEditing = editingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-100/40 ${
                      isCurrentlyEditing ? 'bg-indigo-50/20 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {item.sku}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-600">
                        {item.category || 'General'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(item.price)}
                    </td>

                    {/* Stock Level Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-300/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {item.quantity} (Low Stock)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-300/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {item.quantity} units
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-600 border border-red-300/20 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete Inventory Item?
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900">
                    "{deleteModalItem.name}"
                  </span>{' '}
                  (SKU: <code className="text-indigo-600">{deleteModalItem.sku}</code>)?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-lg shadow-red-600/20 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
