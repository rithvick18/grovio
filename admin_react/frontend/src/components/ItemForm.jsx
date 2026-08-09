import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, XCircle, Tag, Hash, Package, DollarSign, Folder, AlertTriangle } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'General',
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Office Supplies',
  'Toys & Games',
  'Sports & Outdoors',
  'Automotive'
];

const ItemForm = ({ onSubmit, editingItem, onCancelEdit, submitting, backendConnected = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: 0,
    price: 0.0,
    category: 'General',
    unit: 'ea',
    image_url: '',
    aisle_location: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        sku: editingItem.sku || '',
        quantity: editingItem.quantity ?? 0,
        price: editingItem.price ?? 0.0,
        category: editingItem.category || 'General',
        unit: editingItem.products?.unit || editingItem.unit || 'ea',
        image_url: editingItem.products?.image_url || editingItem.image_url || '',
        aisle_location: editingItem.products?.aisle_location || editingItem.aisle_location || '',
      });
      setErrors({});
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      quantity: 0,
      price: 0.0,
      category: 'General',
      unit: 'ea',
      image_url: '',
      aisle_location: '',
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required.';
    }

    if (!editingItem && !formData.sku.trim()) {
      newErrors.sku = 'SKU is required.';
    }

    const qtyNum = Number(formData.quantity);
    if (isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      newErrors.quantity = 'Quantity must be a non-negative integer.';
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Price must be a non-negative number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      quantity: parseInt(formData.quantity, 10),
      price: parseFloat(formData.price),
      category: formData.category.trim() || 'General',
      unit: formData.unit,
      image_url: formData.image_url,
      aisle_location: formData.aisle_location,
    };

    onSubmit(payload, editingItem ? editingItem.id : null, resetForm);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {editingItem ? (
            <Edit3 className="w-5 h-5 text-indigo-600" />
          ) : (
            <PlusCircle className="w-5 h-5 text-emerald-600" />
          )}
          <h2 className="text-lg font-semibold text-slate-900">
            {editingItem ? 'Edit Inventory Item' : 'Add New Item'}
          </h2>
        </div>
        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!backendConnected && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Backend is not connected. Form is disabled.</span>
          </div>
        )}
        {/* Item Name */}
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" /> Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Ergonomic Mouse"
              disabled={!backendConnected}
              className={`w-full bg-white border ${
                errors.name ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-500'
              } rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-500" /> Stock Keeping Unit (SKU) *
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            disabled={Boolean(editingItem) || !backendConnected}
            placeholder="e.g. TECH-WM-001"
            className={`w-full bg-white border ${
              editingItem || !backendConnected
                ? 'border-slate-300 text-slate-500 cursor-not-allowed bg-slate-50'
                : errors.sku
                ? 'border-red-500/80 focus:ring-red-500'
                : 'border-slate-300 focus:border-indigo-500'
            } rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors uppercase`}
          />
          {editingItem && (
            <p className="text-xs text-slate-500 mt-1">SKU cannot be modified once item is created.</p>
          )}
          {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
        </div>

        {/* Quantity & Price Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" /> Quantity *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              disabled={!backendConnected}
              className={`w-full bg-white border ${
                errors.quantity ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-500'
              } rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
              }`}
            />
            {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Price ($) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              disabled={!backendConnected}
              className={`w-full bg-white border ${
                errors.price ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-300 focus:border-indigo-500'
              } rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
              }`}
            />
            {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-slate-500" /> Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={!backendConnected}
            className={`w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
            }`}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat} className="bg-white text-slate-900">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="unit" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              Unit
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              disabled={!backendConnected}
              className={`w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
              }`}
              placeholder="ea, kg, etc."
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="aisle_location" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              Aisle Location
            </label>
            <input
              type="text"
              id="aisle_location"
              name="aisle_location"
              value={formData.aisle_location}
              onChange={handleChange}
              disabled={!backendConnected}
              className={`w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
              }`}
              placeholder="e.g. Aisle 1"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="image_url" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            Image URL
          </label>
          <input
            type="text"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            disabled={!backendConnected}
            className={`w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              !backendConnected ? 'cursor-not-allowed bg-slate-50' : ''
            }`}
            placeholder="https://..."
          />
        </div>

        {/* Submit & Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !backendConnected}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              editingItem
                ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20'
            } ${(submitting || !backendConnected) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : editingItem ? (
              <>
                <Edit3 className="w-4 h-4" /> Save Changes
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Add to Inventory
              </>
            )}
          </button>

          {editingItem && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={submitting}
              className="py-2.5 px-4 rounded-lg font-medium text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
