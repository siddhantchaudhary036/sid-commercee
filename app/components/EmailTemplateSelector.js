"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Eye, Plus, X, Sparkles, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export function EmailTemplateSelector({ onSelect, selectedId, userId, allowCreate = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const templates = useQuery(
    api.emailTemplates.list,
    userId ? { userId, category: categoryFilter || undefined } : "skip"
  );

  const selectedTemplate = useQuery(
    api.emailTemplates.getById,
    selectedId ? { id: selectedId } : "skip"
  );

  const router = useRouter();

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (templateId) => {
    onSelect(templateId);
    setIsOpen(false);
    setSearchTerm("");
    setCategoryFilter("");
  };

  return (
    <div>
      {/* Selected Template Display */}
      <div
        onClick={() => setIsOpen(true)}
        className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition"
      >
        {selectedTemplate ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {selectedTemplate.isSystem && (
                <Sparkles className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-semibold text-gray-900">
                {selectedTemplate.name}
              </span>
              <span className="text-xs text-gray-500">
                • {selectedTemplate.category}
              </span>
            </div>
            <div className="text-xs text-gray-600 mb-1">
              Subject: {selectedTemplate.subject}
            </div>
            <div className="text-xs text-gray-500 line-clamp-2">
              {selectedTemplate.content.substring(0, 100)}...
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Click to select an email template</span>
          </div>
        )}
      </div>

      {/* Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Select Email Template
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">All Categories</option>
                  <option value="Welcome">Welcome</option>
                  <option value="Win-back">Win-back</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Transactional">Transactional</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!templates ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Loading templates...
                </div>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template._id}
                      className={`border rounded-lg p-4 hover:border-gray-400 transition cursor-pointer ${
                        selectedId === template._id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => handleSelect(template._id)}>
                          <div className="flex items-center gap-2 mb-2">
                            {template.isSystem && (
                              <Sparkles className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-semibold text-gray-900">
                              {template.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-300">
                              {template.category}
                            </span>
                            {template.isSystem && (
                              <span className="text-xs text-gray-500">
                                System Template
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Subject:</span>{" "}
                            {template.subject}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {template.content.substring(0, 150)}
                            {template.content.length > 150 && "..."}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template);
                          }}
                          className="ml-3 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">No templates found</p>
                  {(searchTerm || categoryFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setCategoryFilter("");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {allowCreate && (
              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/emails/editor");
                  }}
                  className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}

function TemplatePreviewModal({ template, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Preview Template
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Template Name
            </div>
            <div className="text-sm text-gray-900">{template.name}</div>
          </div>
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Subject
            </div>
            <div className="text-sm text-gray-900">{template.subject}</div>
          </div>
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Content Preview
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div
                dangerouslySetInnerHTML={{ __html: template.content }}
                style={{
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  lineHeight: "1.6",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
